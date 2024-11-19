# Exercise Prescription App - Backend
This repository contains the backend implementation for the Exercise Prescription App, which enables users to schedule notifications for their therapy exercises. The backend is built using Node.js with Express and MongoDB as the database. Notifications are sent via Firebase Cloud Messaging (FCM).

## Features

### User Schedule Management:
Users can schedule multiple notifications for their therapy exercises.
Notifications include a message and a scheduled time.

Notifications are sent using Firebase Cloud Messaging.
Cron jobs check and trigger notifications at the scheduled time.


### API Endpoints:

**Create or Update a Schedule: POST /api/schedule**
Sample body: {
  "userId": "testUser",
  "fcmToken": "valid_fcm_token",
  "notifications": [
    {
      "time": "2024-11-19T05:54:00.000Z",
      "message": "Time for your hand therapy!"
    }
  ]
}

**Get User Schedules: GET /api/schedule/:userId**

**Delete User Schedule: DELETE /api/schedule/:userId**

### Technologies Used
Node.js: Server-side JavaScript runtime.
Express: Web framework for building APIs.
MongoDB: NoSQL database for storing schedules.
Firebase Admin SDK: For sending push notifications.
Mongoose: MongoDB object modeling tool.
node-cron: For scheduling tasks.


### Testing Notifications
**1. Scheduling Notifications**
Use Postman or cURL to create a schedule. Ensure the time is in UTC.

**2. Monitor Logs**
The cron job (notificationScheduler.js) runs every minute and checks for notifications. You should see logs like:

_Checking for notifications...
Sending notification: Time for your hand therapy!
Notification sent successfully: <response>_
