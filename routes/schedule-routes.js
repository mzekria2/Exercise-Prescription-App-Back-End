const express = require('express');
const { getSchedules, createSchedule, deleteSchedule } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/:userId', getSchedules);
router.post('/', createSchedule);
router.delete('/:userId', deleteSchedule);

module.exports = router;
