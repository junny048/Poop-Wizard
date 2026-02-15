const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.submitScore = functions
  .region("us-central1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }

    const uid = context.auth.uid;
    const score = Number(data?.score);
    const stage = Number(data?.stage);
    const level = Number(data?.level);

    if (!Number.isFinite(score) || !Number.isFinite(stage) || !Number.isFinite(level)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid score payload.");
    }
    if (score < 0 || score > 100000000) {
      throw new functions.https.HttpsError("invalid-argument", "Score out of range.");
    }
    if (stage < 1 || stage > 10000 || level < 1 || level > 10000) {
      throw new functions.https.HttpsError("invalid-argument", "Stage/level out of range.");
    }

    const userDoc = await db.collection("users").doc(uid).get();
    const username = userDoc.exists && userDoc.data()?.username
      ? String(userDoc.data().username).slice(0, 20)
      : `user_${uid.slice(0, 6)}`;

    await db.collection("scores").add({
      uid,
      userId: username,
      score: Math.floor(score),
      stage: Math.floor(stage),
      level: Math.floor(level),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { ok: true };
  });
