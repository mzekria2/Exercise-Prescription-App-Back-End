const admin = require('firebase-admin');
const serviceAccount = require('../firebaseServiceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (schedule) => {
  try {
    const { fcmTokens, notifications } = schedule;

    // Iterate through all tokens and send notifications
    for (const token of fcmTokens) {
      for (const notification of notifications) {
        await admin.messaging().send({
          token,
          notification: {
            title: "Reminder",
            body: notification.message,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

module.exports = { sendNotification };
