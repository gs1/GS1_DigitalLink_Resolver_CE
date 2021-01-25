// daemonServices are where any timer event driven tasks are initialised.
// daemons are tasks that runs as a background process,
// rather than being executed as the result of an interactive user client.

const utils = require('./resolver_utils');
const ra = require('../db/query-controller/resolver-auth');

// END-OF-DAY DAEMON
// Launch END-Of-DAY timer which will run once every 24 hours
// 1000 milliseconds x 60 seconds x 60 minutes x 24 hours = 86400000;
// eslint-disable-next-line camelcase
const endOfDay_d = () => {
  setInterval(ra.runEndOfDaySQL, 86400000);
  utils.logThis(
    `End of Day SQL Processing set up to run every day at ${new Date().getUTCHours().toString().padStart(2, '0')}:${new Date()
      .getUTCMinutes()
      .toString()
      .padStart(2, '0')} UTC`,
  );
};

// eslint-disable-next-line camelcase
const updateLinktypes_d = () => {
  const interval = process.env.LINKTYPES_REFRESH_INTERVAL_MINS || 1440;
  //  const sourceUrl = process.env.LINKTYPES_SOURCE_URL;

  global.setImmediate(utils.getLinkTypesFromGS1, interval * 60000);
  utils.logThis(
    `Pull LinkTypes from LinkTypes URL source every ${interval} minutes at ${new Date()
      .getUTCHours()
      .toString()
      .padStart(2, '0')}:${new Date().getUTCMinutes().toString().padStart(2, '0')} UTC`,
  );
};

module.exports = {
  endOfDay_d,
  updateLinktypes_d,
};
