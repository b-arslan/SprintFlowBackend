import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to: string, link: string) => {
    try {
        await resend.emails.send({
            from: "SprintFlow <onboarding@resend.dev>",
            to,
            subject: "Verify your SprintFlow email",
            html: `
                <h2>Welcome to SprintFlow!</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${link}">${link}</a>
                <p>This link will expire in 24 hours.</p>
            `,
        });
    } catch (error) {
        console.error("Email sending failed", error);
        throw new Error("Failed to send verification email");
    }
};