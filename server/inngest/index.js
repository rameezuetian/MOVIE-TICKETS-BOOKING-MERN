import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { clerkClient } from "@clerk/express";
import nodemailer from "nodemailer";

// Create Inngest client
export const inngest = new Inngest({
    id: "movie-ticket-booking",
});

// Sync user creation from Clerk
const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: {
            event: "clerk/user.created",
        },
    },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url,
        } = event.data;

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            image: image_url,
        };

        await User.create(userData);
    }
);

// Sync user deletion from Clerk
const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-from-clerk",
        triggers: {
            event: "clerk/user.deleted",
        },
    },
    async ({ event }) => {
        const { id } = event.data;

        await User.findByIdAndDelete(id);
    }
);

// Sync user updates from Clerk
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: {
            event: "clerk/user.updated",
        },
    },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url,
        } = event.data;

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            image: image_url,
        };

        await User.findByIdAndUpdate(id, userData);
    }
);

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

const sendBookingConfirmationEmail = inngest.createFunction(
    {
        id: "send-booking-confirmation-email",
        triggers: { event: "booking/paid" },
    },
    async ({ event, step }) => {
        const bookingDetails = await step.run("load-paid-booking", async () => {
            const booking = await Booking.findById(event.data.bookingId);

            if (!booking) throw new Error(`Booking ${event.data.bookingId} was not found`);
            if (!booking.isPaid) throw new Error(`Booking ${event.data.bookingId} is not paid yet`);

            const userId = booking.user;
            await booking.populate("user");
            await booking.populate({ path: "show", populate: { path: "movie" } });
            let email = booking.user?.email;
            let customerName = booking.user?.name || "Movie fan";
            if (!email) {
                const clerkUser = await clerkClient.users.getUser(userId);
                email = clerkUser.emailAddresses?.find((address) => address.id === clerkUser.primaryEmailAddressId)?.emailAddress
                    || clerkUser.emailAddresses?.[0]?.emailAddress;
                customerName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || customerName;
            }
            if (!email) throw new Error(`No email address found for booking ${booking._id}`);
            if (!booking.show?.movie) throw new Error(`Show or movie missing for booking ${booking._id}`);

            return {
                email,
                customerName,
                movieTitle: booking.show.movie.title,
                showDateTime: booking.show.showDateTime.toISOString(),
                seats: booking.bookedSeats,
                amount: booking.amount,
                currency: (process.env.STRIPE_CURRENCY || "usd").toUpperCase(),
                bookingId: booking._id.toString(),
            };
        });

        await step.run("send-booking-email", async () => {
            if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is not configured");

            const safeName = escapeHtml(bookingDetails.customerName);
            const safeTitle = escapeHtml(bookingDetails.movieTitle);
            const safeSeats = bookingDetails.seats.map(escapeHtml).join(", ");
            const showTime = new Date(bookingDetails.showDateTime).toLocaleString("en-US", {
                dateStyle: "medium", timeStyle: "short", timeZone: process.env.TZ || "UTC",
            });
            const message = {
                from: process.env.EMAIL_FROM,
                to: bookingDetails.email,
                subject: `Booking confirmed: ${bookingDetails.movieTitle}`,
                html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222"><h1>Booking confirmed</h1><p>Hello ${safeName},</p><p>Your payment was received and your movie booking is confirmed.</p><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px">Movie</td><td style="padding:8px"><strong>${safeTitle}</strong></td></tr><tr><td style="padding:8px">Show time</td><td style="padding:8px">${escapeHtml(showTime)}</td></tr><tr><td style="padding:8px">Seats</td><td style="padding:8px">${safeSeats}</td></tr><tr><td style="padding:8px">Total</td><td style="padding:8px">${escapeHtml(bookingDetails.currency)} ${escapeHtml(bookingDetails.amount)}</td></tr><tr><td style="padding:8px">Booking reference</td><td style="padding:8px">${escapeHtml(bookingDetails.bookingId)}</td></tr></table><p>Enjoy the show!</p></div>`,
            };

            if (process.env.SMTP_HOST) {
                const port = Number(process.env.SMTP_PORT || 587);
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port,
                    secure: process.env.SMTP_SECURE
                        ? process.env.SMTP_SECURE.toLowerCase() === "true"
                        : port === 465,
                    ...(process.env.SMTP_USER ? {
                        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
                    } : {}),
                });
                return transporter.sendMail(message);
            }

            if (!process.env.RESEND_API_KEY) {
                throw new Error("Configure SMTP_HOST for Nodemailer or RESEND_API_KEY for Resend");
            }
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...message, to: [message.to] }),
            });
            if (!response.ok) throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
            return response.json();
        });
    }
);

// Export all Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    sendBookingConfirmationEmail,
];
