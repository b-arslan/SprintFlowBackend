import admin from 'firebase-admin';

const decodedCred = Buffer.from(process.env.FIREBASE_CREDENTIAL_BASE64!, 'base64').toString();
const serviceAccount = JSON.parse(decodedCred);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();