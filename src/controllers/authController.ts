import { Request, Response } from "express";
import { db } from "../utils/firebase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { sendVerificationEmail } from "../utils/sendVerificationEmail";

const JWT_SECRET = process.env.JWT_SECRET || "";
const FRONTEND_APP_URL =
    process.env.FRONTEND_APP_URL || "https://sprintflow-frontend.vercel.app";

// register controller
export const register = async (req: Request, res: Response): Promise<any> => {
    const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(6),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid input" });
    }

    const { email, name, password } = result.data;

    const userRef = db.collection("users").doc(email);
    const existingUser = await userRef.get();
    if (existingUser.exists) {
        return res
            .status(400)
            .json({ success: false, error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await userRef.set({
        email,
        name,
        passwordHash,
        joinedRetros: [],
        isEmailVerified: false,
    });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

    const verificationToken = jwt.sign({ email }, JWT_SECRET, {
        expiresIn: "1d",
    });
    const verificationLink = `${FRONTEND_APP_URL}/verify-email?token=${verificationToken}`;
    const resendLink = `${FRONTEND_APP_URL}/resend-email?email=${encodeURIComponent(email)}`;

    await sendVerificationEmail(
        email,
        `
        <h2>Welcome to SprintFlow!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <br/><br/>
        <p>Didn't get the email?</p>
        <a href="${resendLink}">Resend Verification Email</a>
        <p>This link will expire in 24 hours.</p>
    `
    );

    res.status(201).json({
        success: true,
        message: "User registered successfully.",
        data: {
            token,
            user: {
                id: "",
                name,
                email,
            },
        },
    });
};

// login controller
export const login = async (req: Request, res: Response): Promise<any> => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid input" });
    }

    const { email, password } = result.data;

    const userRef = db.collection("users").doc(email);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        return res
            .status(401)
            .json({ success: false, error: "User not found" });
    }

    const userData = userSnap.data();

    if (!userData?.isEmailVerified) {
        return res
            .status(403)
            .json({
                success: false,
                error: "Please verify your email before logging in.",
            });
    }

    const isMatch = await bcrypt.compare(password, userData?.passwordHash);
    if (!isMatch) {
        return res
            .status(401)
            .json({ success: false, error: "Invalid password" });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
        success: true,
        message: "Login successful.",
        data: {
            token,
            name: userData?.name || "",
            email: userData?.email || "",
        },
    });
};

export const verifyEmail = async (
    req: Request,
    res: Response
): Promise<any> => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
        return res
            .status(400)
            .json({ success: false, error: "Token missing or invalid" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

        const email = decoded.email;
        if (!email) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid token" });
        }

        const userRef = db.collection("users").doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }

        const userData = userDoc.data();
        if (userData?.isEmailVerified) {
            return res
                .status(400)
                .json({ success: false, error: "Email already verified" });
        }

        await userRef.update({
            isEmailVerified: true,
        });

        return res
            .status(200)
            .json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        console.error("Email verification error:", error);
        return res
            .status(400)
            .json({ success: false, error: "Invalid or expired token" });
    }
};

export const resendVerification = async (
    req: Request,
    res: Response
): Promise<any> => {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
        return res
            .status(400)
            .json({ success: false, error: "Email is required" });
    }

    const userRef = db.collection("users").doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res
            .status(404)
            .json({ success: false, error: "User not found" });
    }

    const userData = userDoc.data();

    if (userData?.isEmailVerified) {
        return res
            .status(400)
            .json({ success: false, error: "Email is already verified" });
    }

    const newToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });
    const newVerificationLink = `https://sprintflowbackend.onrender.com/api/v1/auth/verify-email?token=${newToken}`;

    const resendLink = `${FRONTEND_APP_URL}/resend-email?email=${encodeURIComponent(email)}`;

    await sendVerificationEmail(
        email,
        `
        <h2>Welcome to SprintFlow!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${newVerificationLink}">Verify Email</a>
        <br/><br/>
        <p>Didn't get the email?</p>
        <a href="${resendLink}">Resend Verification Email</a>
        <p>This link will expire in 24 hours.</p>
    `
    );

    return res
        .status(200)
        .json({ success: true, message: "Verification email resent." });
};