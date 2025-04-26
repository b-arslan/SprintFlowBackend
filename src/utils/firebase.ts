import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseCredential = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIAL_BASE64!, 'base64').toString('utf8')
);

const app = initializeApp({
  credential: cert(firebaseCredential),
});

export const db = getFirestore(app);