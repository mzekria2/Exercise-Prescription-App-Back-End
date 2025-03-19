const Agenda = require("agenda");
require("dotenv").config();

const mongoConnectionString = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_URL}/agenda-jobs`;

const agenda = new Agenda({ db: { address: mongoConnectionString, collection: "jobs" } });

// Define a job type for sending notifications
agenda.define("send notification", async (job) => {
  const { pushToken, title, body } = job.attrs.data;

  const { Expo } = require("expo-server-sdk");
  const expo = new Expo();

  if (Expo.isExpoPushToken(pushToken)) {
    try {
      await expo.sendPushNotificationsAsync([
        {
          to: pushToken,
          sound: "default",
          title,
          body,
        },
      ]);
      console.log(`Notification sent to ${pushToken}`);
    } catch (error) {
      console.error(`Error sending notification to ${pushToken}:`, error);
    }
  } else {
    console.error(`Invalid Expo Push Token: ${pushToken}`);
  }
});

// Start Agenda
(async () => {
  await agenda.start();
  console.log("Agenda started");
})();

module.exports = agenda;
