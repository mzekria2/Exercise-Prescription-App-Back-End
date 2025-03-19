const express = require("express");
const { Expo } = require("expo-server-sdk");
const Schedule = require("../models/schedule");
const agenda = require("../models/agenda"); // Agenda instance

const router = express.Router();
const expo = new Expo();  

function convertTimeTo24Hour(timeStr) {
  // Replace any non-breaking spaces with a regular space, then trim
  timeStr = timeStr.replace(/\u202F/g, ' ').trim(); 
  // Split on a normal space
  const parts = timeStr.split(" ");
  if (parts.length !== 2) {
    console.error("Time string format error:", timeStr);
    return timeStr; // fallback to original
  }
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  minutes = minutes; // leave as string
  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }
  // Ensure two-digit formatting
  const hourStr = hours < 10 ? "0" + hours : "" + hours;
  return `${hourStr}:${minutes}`;
}



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
// Schedule Notifications
// This route now accepts a notifications array from the frontend.
// Each notification object should have: dayOfWeek, times (array), messages (array)
// -----------------------------------------------------------------------------
// router.post("/schedule", async (req, res) => {
//   const { userId, pushToken, notifications } = req.body;

//   if (!userId || !pushToken || !notifications) {
//     return res.status(400).json({ error: "userId, pushToken, and notifications are required." });
//   }

//   if (!Expo.isExpoPushToken(pushToken)) {
//     return res.status(400).json({ error: "Invalid Expo Push Token." });
//   }

//   notifications.forEach(notification => {
//     const { dayOfWeek, times, messages } = notification;
//     if (!dayOfWeek || !times || !messages || times.length !== messages.length) {
//       console.error("Invalid notification format:", notification);
//       return; // or handle error as needed
//     }

//     times.forEach((time, i) => {
//       const msg = messages[i];
//       const [hour, minute] = time.split(":");
//       const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
//       const jobName = `send-notification-${userId}-${dayOfWeek}-${time}-${i}`;

//       // Schedule the notification; errors here won't delay the response
//       agenda.every(
//         cronExpression,
//         "send notification",
//         { pushToken, title: "Scheduled Notification", body: msg, userId },
//         { jobId: jobName }
//       ).catch((err) => console.error("Failed to schedule notification:", err));
//     });
//   });

//   // Immediately respond to the client
//   res.status(200).json({ message: "Notifications scheduled successfully." });
// });
// -----------------------------------------------------------------------------
// Schedule Notifications
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
    // 1. Schedule notifications with Agenda
    notifications.forEach(notification => {
      const { dayOfWeek, times, messages } = notification;
      if (!dayOfWeek || !times || !messages || times.length !== messages.length) {
        console.error("Invalid notification format:", notification);
        return; // or handle error differently if you want strict validation
      }

      times.forEach((time, i) => {
        const msg = messages[i];
        // Parse hour and minute from the time string
        // const [hour, minute] = time.split(":");
        const time24 = convertTimeTo24Hour(time);
        const [hour, minute] = time24.split(":");
        // Construct a cron expression, e.g. "30 10 * * 1" for Monday 10:30
        console.log(`Pairing for dayOfWeek ${dayOfWeek}: time="${time}" (converted to ${time24}) -> message="${msg}"`);
        const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;
        console.log(`Cron Expression: ${cronExpression} for job: send-notification-${userId}-${dayOfWeek}-${time}-${i}`);
        const jobName = `send-notification-${userId}-${dayOfWeek}-${time}-${i}`;

        // Schedule the notification job in Agenda
        agenda.every(
          cronExpression,
          "send notification",
          { pushToken, title: "Scheduled Notification", body: msg, userId },
          { jobId: jobName }
        ).catch((err) => console.error("Failed to schedule notification:", err));
      });
    });

    // 2. Store notifications in MongoDB under this user's schedule document
    await Schedule.findOneAndUpdate(
      { userId },
      {
        // Ensure the push token is in expoPushTokens (without duplication)
        $addToSet: { expoPushTokens: pushToken },
        // Append all incoming notifications to the "notifications" array
        $push: {
          notifications: {
            $each: notifications,
          },
        },
      },
      { upsert: true, new: true }
    );

    // 3. Send an immediate success response
    return res.status(200).json({ message: "Notifications scheduled and stored successfully." });

  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return res.status(500).json({ error: "Failed to schedule notifications." });
  }
});

//   try {
//     // Loop through each notification object in the notifications array.
//     for (const notification of notifications) {
//       const { dayOfWeek, times, messages } = notification;

//       // Validate that dayOfWeek, times, and messages are provided and arrays match in length.
//       if (!dayOfWeek || !times || !messages || times.length !== messages.length) {
//         console.error("Invalid notification format:", notification);
//         continue; // or return an error if you prefer strict validation
//       }

//       // Loop through each time/message pair.
//       for (let i = 0; i < times.length; i++) {
//         const time = times[i];      // Expecting time in "HH:MM" format
//         const msg = messages[i];
//         const title = "Scheduled Notification"; // Default title
//         const body = msg; // Use the message as the body

//         // Create a unique job name for this notification
//         const jobName = `send-notification-${userId}-${dayOfWeek}-${time}-${i}`;

//         // Create a cron expression.
//         // Assuming time is in "HH:MM" 24-hour format.
//         const [hour, minute] = time.split(":");
//         // Cron format: "minute hour * * dayOfWeek"
//         // Note: Cron day-of-week values are 0-7 (0 and 7 represent Sunday).
//         // Here, dayOfWeek is provided by the frontend (e.g., Monday = 1, Tuesday = 2, etc.).
//         const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;

//         // Schedule the notification using Agenda.
//         await agenda.every(
//           cronExpression,
//           "send notification",
//           { pushToken, title, body, userId },
//           { jobId: jobName }
//         );
//       }
//     }

//     res.status(200).json({ message: "Notifications scheduled successfully." });
//   } catch (error) {
//     console.error("Error scheduling notifications:", error);
//     res.status(500).json({ error: "Failed to schedule notifications." });
//   }
// });

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
// Note: You might need to modify this to match your scheduling approach.
// -----------------------------------------------------------------------------
router.delete("/delete/:userId/:dayOfWeek/:time/:index", async (req, res) => {
  try {
    const { userId, dayOfWeek, time, index } = req.params;
    const decodedTime = decodeURIComponent(time);
    const dayNumber = parseInt(dayOfWeek, 10);
    const notifIndex = parseInt(index, 10);
    console.log(`Deleting notification for user ${userId}, day ${dayNumber}, time "${decodedTime}", index ${notifIndex}`);
    
    // Construct the Agenda job name exactly as in scheduling
    const jobName = `send-notification-${userId}-${dayOfWeek}-${decodedTime}-${index}`;
    console.log(`Constructed job name: ${jobName}`);
    
    // Cancel the corresponding Agenda job
    const agendaResult = await agenda.cancel({ name: jobName });
    console.log(`Agenda job cancelled: ${agendaResult}`);
    
    // Retrieve the user's schedule document
    const schedule = await Schedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ error: "User schedule not found" });
    }
    
    // Use refined find logic to get the correct notification object
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
    
    // Log the stored time at the given index for debugging
    console.log(`Stored time at index ${notifIndex}: "${notif.times[notifIndex]}"`);
    
    // Remove the specific time and its corresponding message
    notif.times.splice(notifIndex, 1);
    notif.messages.splice(notifIndex, 1);
    
    // If no times remain, remove the entire notification subdocument
    if (notif.times.length === 0) {
      schedule.notifications = schedule.notifications.filter(n => n !== notif);
    }

    // Remove any notifications that don't have a valid dayOfWeek
    schedule.notifications = schedule.notifications.filter(n => n.dayOfWeek !== undefined);

    
    // Save the updated schedule document
    await schedule.save();
    
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

router.post("/snooze/:userId/:dayOfWeek/:time", async (req, res) => {
  try {
    const { userId, dayOfWeek, time } = req.params;
    console.log(`Snoozing notification for ${userId}, day ${dayOfWeek}, time ${time}`);

    const decodedTime = decodeURIComponent(time);
    const [hour, minute] = decodedTime.split(":").map(Number);

    // Add 15 minutes
    let newHour = hour;
    let newMinute = minute + 15;
    if (newMinute >= 60) {
      newMinute -= 60;
      newHour += 1;
    }

    const newTime = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
    console.log(`New snooze time: ${newTime}`);

    // Cancel the existing notification
    const jobName = `send-notification-${userId}-${dayOfWeek}-${decodedTime}`;
    await agenda.cancel({ name: jobName });

    // Schedule new notification
    const newJobName = `send-notification-${userId}-${dayOfWeek}-${newTime}`;
    await agenda.every(
      `${newMinute} ${newHour} * * ${dayOfWeek}`,
      "send notification",
      { userId, title: "Snoozed Notification", body: `Reminder snoozed to ${newTime}`, pushToken: req.body.pushToken },
      { jobId: newJobName }
    );

    // Update database
    const schedule = await Schedule.findOneAndUpdate(
      { userId },
      {
        $pull: { notifications: { dayOfWeek: parseInt(dayOfWeek), times: decodedTime } },
        $push: { notifications: { dayOfWeek: parseInt(dayOfWeek), times: newTime, messages: "Snoozed Reminder" } }
      },
      { new: true }
    );

    res.status(200).json({ message: "Notification snoozed successfully.", newTime });
  } catch (error) {
    console.error("Error snoozing notification:", error);
    res.status(500).json({ error: "Failed to snooze notification." });
  }
});


// -----------------------------------------------------------------------------
// Test Notification
// -----------------------------------------------------------------------------
router.post("/test-notification", async (req, res) => {
  const { expoPushToken, message } = req.body;

  if (!expoPushToken || !message) {
    return res.status(400).json({ error: "expoPushToken and message are required." });
  }

  if (!Expo.isExpoPushToken(expoPushToken)) {
    return res.status(400).json({ error: "Invalid Expo Push Token." });
  }

  try {
    const notifications = [
      {
        to: expoPushToken,
        sound: "default",
        title: "Test Notification",
        body: message,
      },
    ];

    const chunks = expo.chunkPushNotifications(notifications);
    const tickets = [];
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    res.status(200).json({ message: "Test notification sent successfully.", tickets });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ error: "Failed to send test notification." });
  }
});

module.exports = router;
