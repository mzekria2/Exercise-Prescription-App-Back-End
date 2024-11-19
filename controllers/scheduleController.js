const Schedule = require('../models/schedule');

// Get schedules for a user
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

// Create or update a schedule
const createSchedule = async (req, res) => {
  try {
    const { userId, fcmToken, notifications } = req.body;
    let schedule = await Schedule.findOne({ userId });

    if (schedule) {
      schedule.fcmToken = fcmToken;
      schedule.notifications = notifications;
    } else {
      schedule = new Schedule({ userId, fcmToken, notifications });
    }

    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error.' });
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

module.exports = { getSchedules, createSchedule, deleteSchedule };
