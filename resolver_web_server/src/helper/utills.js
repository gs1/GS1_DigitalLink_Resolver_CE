/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) => {
  console.log(`${new Date().toUTCString()} >> ${textToLog}`);
};

module.exports = {
  logThis,
};
