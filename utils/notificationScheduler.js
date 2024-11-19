const cron = require('node-cron');
const Schedule = require('../models/schedule');
const { sendNotification } = require('./notificationSender');

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('Checking for notifications...');
  
  const now = new Date();
  
  try {
    const schedules = await Schedule.find();
    
    schedules.forEach(schedule => {
      schedule.notifications.forEach(notification => {
        const notifTime = new Date(notification.time);
        
        // Compare only year, month, day, hour, and minute
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
});
