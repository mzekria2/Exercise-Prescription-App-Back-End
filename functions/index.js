const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const Schedule = require('./models/schedule'); 

admin.initializeApp();

// MongoDB connection
const mongoURI = `mongodb+srv://${functions.config().mongodb.user}:${functions.config().mongodb.pass}@${functions.config().mongodb.url}`;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected in Cloud Function'))
  .catch((err) => console.error('MongoDB connection error in Cloud Function:', err));

exports.scheduledNotificationSender = functions.pubsub.schedule('*/30 * * * *').onRun(async (context) => {
  console.log('Checking for notifications...');

  const now = new Date();
  const currentDay = now.toLocaleString('en-US', { weekday: 'long' }); 
  const currentTime = now.toTimeString().slice(0, 5); 

  try {
    const schedules = await Schedule.find();

    schedules.forEach((schedule) => {
      schedule.notifications.forEach((notification) => {
        if (
          notification.daysOfWeek.includes(currentDay) &&
          notification.time === currentTime
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

