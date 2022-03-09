const JobState = require('../../models/constants/job-state');
const EventType = require('../../models/constants/event-type');

module.exports = {
  STORE_CHANGE: 'STORE_CHANGE_',
  jobStates: JobState,
  eventTypes: EventType,
};
