import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
    to: string,
    htmlContent: string
) => {
    try {
        console.log("Sending verification email to:", to);

        const response = await resend.emails.send({
            from: "SprintFlow <onboarding@resend.dev>",
            to,
            subject: "Verify your SprintFlow email",
            html: htmlContent,
        });

        console.log("Resend email response:", JSON.stringify(response));
    } catch (error: any) {
        console.error(
            "Error sending verification email:",
            JSON.stringify(error)
        );
        throw new Error("Failed to send verification email");
    }
};