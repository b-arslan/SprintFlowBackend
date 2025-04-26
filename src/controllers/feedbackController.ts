import { Response } from "express";
import { db } from "../utils/firebase";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { io } from "../index";

export const submitFeedback = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const schema = z.object({
        sprintId: z.string().min(5),
        start: z.string().optional(),
        stop: z.string().optional(),
        continue: z.string().optional(),
    });

    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid input" });
    }

    const { sprintId, start, stop } = result.data;
    const continueDoing = result.data["continue"];
    const email = req.userEmail;

    if (!email) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error" });
    }

    if (!start && !stop && !continueDoing) {
        return res.status(400).json({
            success: false,
            error: "At least one feedback field must be filled.",
        });
    }

    const feedbackId = `fdb_${uuidv4().slice(0, 8)}`;

    await db
        .collection("feedbacks")
        .doc(feedbackId)
        .set({
            id: feedbackId,
            sprintId,
            createdBy: email,
            start: start || null,
            stop: stop || null,
            continue: continueDoing || null,
            upvotes: 0,
            downvotes: 0,
            createdAt: new Date().toISOString(),
        });

    io.emit("feedbackUpdated", { sprintId });

    res.status(201).json({
        success: true,
        message: "Feedback submitted successfully.",
        data: { feedbackId },
    });
};