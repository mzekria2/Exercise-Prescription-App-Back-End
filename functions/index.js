const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const Schedule = require('./models/schedule'); // Your Mongoose model

admin.initializeApp();

// MongoDB connection
const mongoURI = `mongodb+srv://${functions.config().mongodb.user}:${functions.config().mongodb.pass}@${functions.config().mongodb.url}`;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected in Cloud Function'))
  .catch((err) => console.error('MongoDB connection error in Cloud Function:', err));

// Cloud Function to run every minute
exports.scheduledNotificationSender = functions.pubsub.schedule('*/30 * * * *').onRun(async (context) => {
  console.log('Checking for notifications...');

  const now = new Date();

  try {
    const schedules = await Schedule.find();

    schedules.forEach((schedule) => {
      schedule.notifications.forEach((notification) => {
        const notifTime = new Date(notification.time);

        if (
          notifTime.getUTCFullYear() === now.getUTCFullYear() &&
          notifTime.getUTCMonth() === now.getUTCMonth() &&
          notifTime.getUTCDate() === now.getUTCDate() &&
          notifTime.getUTCHours() === now.getUTCHours() &&
          notifTime.getUTCMinutes() === now.getUTCMinutes()
        ) {
          console.log(`Sending notification: ${notification.message}`);
          sendNotification(schedule.fcmToken, notification.message);
        }
      });
    });
  } catch (error) {
    console.error('Error in notification scheduler:', error);
  }

  return null;
});

// Helper function to send notifications
async function sendNotification(fcmToken, message) {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Exercise Reminder',
        body: message,
      },
    });
    console.log('Notification sent successfully!');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
