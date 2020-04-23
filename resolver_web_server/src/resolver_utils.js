const logThis = (textToLog) =>
{
    console.log((new Date()).toUTCString() + " >> " + textToLog)
};

module.exports.logThis = logThis;