//daemonServices are where any timer event driven tasks are initialised.
//daemons are tasks that runs as a background process,
// rather than being executed as the result of an interactive user client.

const utils = require('../bin/resolver_utils');
const db = require('../db/sqldb');


//END-OF-DAY DAEMON
//Launch END-Of-DAY timer which will run once every 24 hours
//1000 milliseconds x 60 seconds x 60 minutes x 24 hours = 86400000;
const endOfDay_d = () =>
{
    setInterval(db.runEndOfDaySQL, 86400000);
    utils.logThis(`End of Day SQL Processing set up to run every day at ${new Date().getUTCHours().toString().padStart(2,'0')}:${new Date().getUTCMinutes().toString().padStart(2,'0')} UTC`);
}


const updateLinktypes_d = () =>
{
    global.setImmediate(utils.getLinkTypesFromGS1, 86400000);
    utils.logThis(`Update LinkTypes set up to run every day at ${new Date().getUTCHours().toString().padStart(2,'0')}:${new Date().getUTCMinutes().toString().padStart(2,'0')} UTC`);
}


module.exports = {
    endOfDay_d,
    updateLinktypes_d
}
