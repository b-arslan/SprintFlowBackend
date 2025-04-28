import { db } from "../utils/firebase";

export const updateExpiredSprintsService = async (): Promise<number> => {
    const now = new Date();

    const activeSprintsSnapshot = await db.collection('sprints')
        .where('status', '==', 'active')
        .get();

    const batch = db.batch();
    let expiredCount = 0;

    activeSprintsSnapshot.forEach((doc) => {
        const sprintData = doc.data();
        if (sprintData.expiresAt) {
            const expiresAt = new Date(sprintData.expiresAt);
            if (!isNaN(expiresAt.getTime()) && expiresAt < now) {
                batch.update(doc.ref, { status: 'expired' });
                expiredCount++;
            }
        }
    });

    if (expiredCount > 0) {
        await batch.commit();
    }

    return expiredCount;
};