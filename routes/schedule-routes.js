const express = require("express");
const { Expo } = require("expo-server-sdk");
const Schedule = require("../models/schedule");
const agenda = require("../models/agenda"); // Agenda instance

const router = express.Router();
const expo = new Expo();
const TIMEZONE = 'America/New_York';

// -----------------------------------------------------------------------------
// Agenda setup: define job handler and start processing
// -----------------------------------------------------------------------------
agenda.define("send notification", async job => {
  const { pushToken, title, body } = job.attrs.data;
  try {
    await expo.sendPushNotificationsAsync([{
      to: pushToken,
      sound: "default",
      title,
      body
    }]);
    console.log(`Notification sent to ${pushToken}: ${title}`);
  } catch (err) {
    console.error("Error sending push notification:", err);
  }
});

(async () => {
  try {
    await agenda.start();
    console.log("Agenda started and ready to process jobs");
  } catch (err) {
    console.error("Failed to start Agenda:", err);
  }
})();

// -----------------------------------------------------------------------------
// Utility: convert 12-hour time strings to 24-hour format
// -----------------------------------------------------------------------------
function convertTimeTo24Hour(timeStr) {
  timeStr = timeStr.replace(/\s+/g, ' ').trim();
  const [timePart, modifier] = timeStr.split(' ');
  if (!timePart || !modifier) {
    console.error("Time string format error:", timeStr);
    return timeStr;
  }
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// Test route
// -----------------------------------------------------------------------------
router.get('/test', (req, res) => {
  console.log("Test route hit!");
  res.status(200).send("Server connection working!");
});

// -----------------------------------------------------------------------------
// Register Expo Push Token
// -----------------------------------------------------------------------------
router.post("/register-token", async (req, res) => {
  const { userId, expoPushToken } = req.body;
  if (!userId || !expoPushToken) {
    return res.status(400).json({ error: "userId and expoPushToken are required." });
  }
  if (!Expo.isExpoPushToken(expoPushToken)) {
    return res.status(400).json({ error: "Invalid Expo Push Token." });
  }
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { userId },
      { $addToSet: { expoPushTokens: expoPushToken } },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Token registered successfully", schedule });
  } catch (error) {
    console.error("Error registering token:", error);
    res.status(500).json({ error: "Failed to register token." });
  }
});

// -----------------------------------------------------------------------------
// Schedule Notifications (with timezone support)
// -----------------------------------------------------------------------------
router.post("/schedule", async (req, res) => {
  const { userId, pushToken, notifications } = req.body;
  if (!userId || !pushToken || !notifications) {
    return res.status(400).json({ error: "userId, pushToken, and notifications are required." });
  }
  if (!Expo.isExpoPushToken(pushToken)) {
    return res.status(400).json({ error: "Invalid Expo Push Token." });
  }
  try {
    notifications.forEach(notification => {
      const { dayOfWeek, times, messages } = notification;
      if (!dayOfWeek || !times || !messages || times.length !== messages.length) {
        console.error("Invalid notification format:", notification);
        return;
      }
      times.forEach((time, i) => {
        const msg = messages[i];
        const time24 = convertTimeTo24Hour(time);
        const [hour, minute] = time24.split(':');
        const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
        const jobName = `send-notification-${userId}-${dayOfWeek}-${time}-${i}`;
        console.log(`Scheduling job ${jobName} (timezone ${TIMEZONE}) with cron ${cronExpression}`);
        agenda.every(
          cronExpression,
          "send notification",
          { pushToken, title: "Scheduled Notification", body: msg, userId },
          { jobId: jobName, timezone: TIMEZONE }
        ).catch(err => console.error("Failed to schedule notification:", err));
      });
    });
    await Schedule.findOneAndUpdate(
      { userId },
      {
        $addToSet: { expoPushTokens: pushToken },
        $push: { notifications: { $each: notifications } },
      },
      { upsert: true, new: true }
    );
    return res.status(200).json({ message: "Notifications scheduled and stored successfully." });
  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return res.status(500).json({ error: "Failed to schedule notifications." });
  }
});

// -----------------------------------------------------------------------------
// Get User Schedules
// -----------------------------------------------------------------------------
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const schedule = await Schedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ error: "No schedules found for this user." });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Failed to fetch schedules." });
  }
});

// -----------------------------------------------------------------------------
// Delete a Notification
// -----------------------------------------------------------------------------
router.delete("/delete/:userId/:dayOfWeek/:time/:index", async (req, res) => {
  try {
    const { userId, dayOfWeek, time, index } = req.params;
    const decodedTime = decodeURIComponent(time);
    const dayNumber = parseInt(dayOfWeek, 10);
    const notifIndex = parseInt(index, 10);
    console.log(`Deleting notification for user ${userId}, day ${dayNumber}, time "${decodedTime}", index ${notifIndex}`);
    const jobName = `send-notification-${userId}-${dayOfWeek}-${decodedTime}-${index}`;
    await agenda.cancel({ name: jobName });
    const schedule = await Schedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ error: "User schedule not found" });
    }
    const notif = schedule.notifications.find(n =>
      n.dayOfWeek === dayNumber &&
      Array.isArray(n.times) &&
      n.times.length > notifIndex &&
      n.times[notifIndex] === decodedTime
    );
    if (!notif) {
      console.error("Notification not found for the given day and index.");
      return res.status(404).json({ error: "Notification time not found" });
    }
    notif.times.splice(notifIndex, 1);
    notif.messages.splice(notifIndex, 1);
    if (notif.times.length === 0) {
      schedule.notifications = schedule.notifications.filter(n => n !== notif);
    }
    await schedule.save();
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

// -----------------------------------------------------------------------------
// Snooze a Notification
// -----------------------------------------------------------------------------
router.post("/snooze/:userId/:dayOfWeek/:time", async (req, res) => {
  try {
    const { userId, dayOfWeek, time } = req.params;
    const decodedTime = decodeURIComponent(time);
    const [hour, minute] = decodedTime.split(":").map(Number);
    let newHour = hour;
    let newMinute = minute + 15;
    if (newMinute >= 60) { newMinute -= 60; newHour += 1; }
    const newTime = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
    const oldJobName = `send-notification-${userId}-${dayOfWeek}-${decodedTime}`;
    await agenda.cancel({ name: oldJobName });
    const cronExp = `${newMinute} ${newHour} * * ${dayOfWeek}`;
    const newJobName = `send-notification-${userId}-${dayOfWeek}-${newTime}`;
    await agenda.every(cronExp, "send notification", { userId, title: "Snoozed Notification", body: `Reminder snoozed to ${newTime}`, pushToken: req.body.pushToken }, { jobId: newJobName, timezone: TIMEZONE });
    const schedule = await Schedule.findOneAndUpdate(
      { userId },
      { $pull: { notifications: { dayOfWeek: parseInt(dayOfWeek), times: decodedTime } }, $push: { notifications: { dayOfWeek: parseInt(dayOfWeek), times: newTime, messages: ["Snoozed Reminder"] } } },
      { new: true }
    );
    res.status(200).json({ message: "Notification snoozed successfully.", newTime });
  } catch (error) {
    console.error("Error snoozing notification:", error);
    res.status(500).json({ error: "Failed to snooze notification." });
  }
});

// -----------------------------------------------------------------------------
// Test Notification Immediately
// -----------------------------------------------------------------------------
router.post("/test-notification", async (req, res) => {
  const { expoPushToken, message } = req.body;
  if (!expoPushToken || !message) return res.status(400).json({ error: "expoPushToken and message are required." });
  if (!Expo.isExpoPushToken(expoPushToken)) return res.status(400).json({ error: "Invalid Expo Push Token." });
  try {
    const notifications = [{ to: expoPushToken, sound: "default", title: "Test Notification", body: message }];
    const chunks = expo.chunkPushNotifications(notifications);
    const tickets = [];
    for (const chunk of chunks) tickets.push(...await expo.sendPushNotificationsAsync(chunk));
    res.status(200).json({ message: "Test notification sent successfully.", tickets });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification." });
  }
});

module.exports = router;