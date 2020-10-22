//This script file is to hold any common utility functions used across two or more of the other scripts

/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) =>
{
    console.log((new Date()).toUTCString() + " >> " + textToLog)
};

module.exports = { logThis };