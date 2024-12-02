const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const Schedule = require('../models/schedule');


const getSchedules = async (req, res) => {
  try {
    const { userId } = req.params;
    const schedule = await Schedule.findOne({ userId });

    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this user.' });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { userId, fcmToken, notifications } = req.body;

    let schedule = await Schedule.findOne({ userId });

    if (!schedule) {
      // Create new schedule if none exists
      schedule = new Schedule({
        userId,
        fcmTokens: [fcmToken],
        notifications,
      });
    } else {
      // Add new token if it doesn't already exist
      if (!schedule.fcmTokens.includes(fcmToken)) {
        schedule.fcmTokens.push(fcmToken);
      }
      schedule.notifications.push(...notifications); // Append notifications
    }

    await schedule.save();

    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// Delete a user's schedule
const deleteSchedule = async (req, res) => {
  try {
    const { userId } = req.params;
    await Schedule.findOneAndDelete({ userId });
    res.status(200).json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

const sendNotification = async (expoPushToken, message) => {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Invalid Expo push token: ${expoPushToken}`);
    return;
  }

  const messages = [
    {
      to: expoPushToken,
      sound: 'default',
      body: message,
    },
  ];

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('Notification sent successfully:', ticketChunk);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};


module.exports = { getSchedules, createSchedule, deleteSchedule };
