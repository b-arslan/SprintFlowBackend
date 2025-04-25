import admin from 'firebase-admin';
import * as serviceAccount from '../../sprintflow-ca441-firebase-adminsdk-fbsvc-9d073ab230.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const db = admin.firestore();