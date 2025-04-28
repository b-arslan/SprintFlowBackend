import { Request, Response } from "express";
import { db } from "../utils/firebase";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "";

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
    });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

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