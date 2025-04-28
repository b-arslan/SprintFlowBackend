import { Request, Response } from "express";
import { db } from "../utils/firebase";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { FieldValue } from "firebase-admin/firestore";
import { updateExpiredSprintsService } from "../utils/updateExpiredSprintsService";

export const createSprint = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const schema = z.object({
        title: z.string().min(3),
        description: z.string().optional(),
        expiresAt: z.string().datetime(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid input" });
    }

    const { title, description, expiresAt } = result.data;
    const createdBy = req.userEmail;

    if (!createdBy) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error" });
    }

    // 📌 Aynı title ile sprint var mı kontrolü ekliyoruz
    const existingSprintSnapshot = await db
        .collection("sprints")
        .where("title", "==", title)
        .limit(1)
        .get();

    if (!existingSprintSnapshot.empty) {
        return res.status(400).json({
            success: false,
            error: "Sprint with this title already exists.",
        });
    }

    const sprintId = uuidv4();

    await db
        .collection("sprints")
        .doc(sprintId)
        .set({
            id: sprintId,
            title,
            description: description || "",
            createdBy,
            createdAt: new Date().toISOString(),
            expiresAt,
            status: "active",
        });

    const userRef = db.collection("users").doc(createdBy);
    await userRef.update({
        joinedRetros: FieldValue.arrayUnion(sprintId),
    });

    res.status(201).json({
        success: true,
        message: "Sprint created successfully.",
        data: { sprintId },
    });
};

export const joinSprint = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const schema = z.object({
        sprintId: z.string().min(5),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid input" });
    }

    const { sprintId } = result.data;
    const email = req.userEmail;

    if (!email) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error" });
    }

    const sprintRef = db.collection("sprints").doc(sprintId);
    const sprintSnap = await sprintRef.get();

    if (!sprintSnap.exists) {
        return res
            .status(404)
            .json({ success: false, error: "Sprint not found" });
    }

    const sprintData = sprintSnap.data();

    if (sprintData?.bannedParticipants?.includes(email)) {
        return res.status(403).json({
            success: false,
            error: "You are banned from this sprint.",
        });
    }

    const userRef = db.collection("users").doc(email);
    await userRef.update({
        joinedRetros: FieldValue.arrayUnion(sprintId),
    });

    await sprintRef.update({
        participants: FieldValue.arrayUnion(email),
    });

    return res.status(200).json({
        success: true,
        message: "Joined sprint successfully.",
    });
};

export const getSprintFeedbacks = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const { sprintId } = req.params;
    const { sort } = req.query;

    if (!sprintId) {
        return res
            .status(400)
            .json({ success: false, error: "Sprint ID is required." });
    }

    try {
        // Sprint bilgisi al
        const sprintDoc = await db.collection("sprints").doc(sprintId).get();
        if (!sprintDoc.exists) {
            return res
                .status(404)
                .json({ success: false, error: "Sprint not found." });
        }
        const sprintData = sprintDoc.data();

        // Feedbackler al
        const snapshot = await db
            .collection("feedbacks")
            .where("sprintId", "==", sprintId)
            .get();

        const feedbacks = snapshot.docs.map((doc) => doc.data());

        const participantSet = new Set<string>();
        feedbacks.forEach((fb) => {
            if (fb.createdBy) {
                participantSet.add(fb.createdBy);
            }
        });
        const participants = Array.from(participantSet);

        // Feedbackleri sıralama
        let sortedFeedbacks = feedbacks;
        if (sort === "upvotes") {
            sortedFeedbacks = feedbacks.sort(
                (a, b) => (b.upvotes || 0) - (a.upvotes || 0)
            );
        } else {
            sortedFeedbacks = feedbacks.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
        }

        return res.status(200).json({
            success: true,
            data: {
                id: sprintDoc.id,
                ...sprintData,
                participants,
                feedbacks: sortedFeedbacks,
            },
        });
    } catch (error) {
        console.error("Error fetching sprint feedbacks:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch sprint feedbacks.",
        });
    }
};

export const getMyJoinedSprints = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const email = req.userEmail;

    if (!email) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error" });
    }

    const userDoc = await db.collection("users").doc(email).get();
    if (!userDoc.exists) {
        return res
            .status(404)
            .json({ success: false, error: "User not found" });
    }

    const userData = userDoc.data();
    const joinedRetros: string[] = userData?.joinedRetros || [];

    if (joinedRetros.length === 0) {
        return res.status(200).json({ success: true, data: [] });
    }

    const sprintsData = await Promise.all(
        joinedRetros.map(async (sprintId) => {
            const sprintDoc = await db
                .collection("sprints")
                .doc(sprintId)
                .get();
            if (sprintDoc.exists) {
                return sprintDoc.data();
            }
            return null;
        })
    );

    const filteredSprints = sprintsData.filter((sprint) => sprint !== null);

    res.status(200).json({
        success: true,
        data: filteredSprints,
    });
};

export const kickParticipant = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const { sprintId } = req.params;
    const { email } = req.body;

    if (!sprintId || !email) {
        return res.status(400).json({
            success: false,
            error: "Sprint ID and email are required.",
        });
    }

    const adminEmail = req.userEmail;
    if (!adminEmail) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error." });
    }

    const sprintRef = db.collection("sprints").doc(sprintId);
    const sprintSnap = await sprintRef.get();

    if (!sprintSnap.exists) {
        return res
            .status(404)
            .json({ success: false, error: "Sprint not found." });
    }

    const sprintData = sprintSnap.data();
    if (sprintData?.createdBy !== adminEmail) {
        return res.status(403).json({
            success: false,
            error: "Only admin can kick participants.",
        });
    }

    const updatedParticipants = (sprintData.participants || []).filter(
        (participant: string) => participant !== email
    );

    await sprintRef.update({ participants: updatedParticipants });

    return res
        .status(200)
        .json({ success: true, message: "Participant kicked successfully." });
};

export const banParticipant = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<any> => {
    const { sprintId } = req.params;
    const { email } = req.body;

    if (!sprintId || !email) {
        return res.status(400).json({
            success: false,
            error: "Sprint ID and email are required.",
        });
    }

    const adminEmail = req.userEmail;
    if (!adminEmail) {
        return res
            .status(403)
            .json({ success: false, error: "Authentication error." });
    }

    const sprintRef = db.collection("sprints").doc(sprintId);
    const sprintSnap = await sprintRef.get();

    if (!sprintSnap.exists) {
        return res
            .status(404)
            .json({ success: false, error: "Sprint not found." });
    }

    const sprintData = sprintSnap.data();
    if (sprintData?.createdBy !== adminEmail) {
        return res.status(403).json({
            success: false,
            error: "Only admin can ban participants.",
        });
    }

    const updatedParticipants = (sprintData.participants || []).filter(
        (participant: string) => participant !== email
    );
    const updatedBanned = [...(sprintData.bannedParticipants || []), email];

    await sprintRef.update({
        participants: updatedParticipants,
        bannedParticipants: updatedBanned,
    });

    return res
        .status(200)
        .json({ success: true, message: "Participant banned successfully." });
};

export const updateExpiredSprints = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const expiredCount = await updateExpiredSprintsService();
        return res.status(200).json({
            success: true,
            message: `${expiredCount} sprint(s) expired.`,
        });
    } catch (error) {
        console.error("Error updating expired sprints:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to update expired sprints.",
        });
    }
};

export const completeSprint = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { id } = req.params;
        const userEmail = (req as any).userEmail;

        if (!userEmail) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized: User email not found",
            });
        }

        const sprintRef = db.collection("sprints").doc(id);
        const sprintDoc = await sprintRef.get();

        if (!sprintDoc.exists) {
            return res.status(404).json({
                success: false,
                error: "Sprint not found",
            });
        }

        const sprintData = sprintDoc.data();

        if (sprintData?.createdBy !== userEmail) {
            return res.status(403).json({
                success: false,
                error: "Only the creator of the sprint can complete it.",
            });
        }

        await sprintRef.update({
            expiresAt: new Date().toISOString(),
            status: "expired",
        });

        return res.status(200).json({
            success: true,
            message: "Sprint successfully completed.",
        });
    } catch (error) {
        console.error("Error completing sprint:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to complete sprint.",
        });
    }
};