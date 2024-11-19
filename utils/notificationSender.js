const admin = require('firebase-admin');
const serviceAccount = require('../firebaseServiceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (fcmToken, message) => {
  const payload = {
    notification: {
      title: 'Exercise Reminder',
      body: message,
    },
  };

  try {
    // Correct way to send to a device
    const response = await admin.messaging().send({
      token: fcmToken,
      notification: payload.notification,
    });
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotification };
