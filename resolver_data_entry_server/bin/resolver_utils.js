//This script file is to hold any common utility functions used across two or more of the other scripts
const GS1DigitalLinkToolkit = require('../public/javascripts/GS1DigitalLinkToolkit');
/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) =>
{
    console.log((new Date()).toUTCString() + " >> " + textToLog)
};

module.exports = { logThis };


const getGS1DigitalLinkToolkitDefinition = (gs1KeyCode, gs1KeyValue) =>
{
    let officialDefinition = { gs1KeyCode: "", gs1KeyValue: "", SUCCESS: true };
    try
    {
        const uriToTest = `https://id.gs1.org/${gs1KeyCode}/${gs1KeyValue}`;
        const dlToolkit = new GS1DigitalLinkToolkit;
        const structuredObject = dlToolkit.analyseURI(uriToTest, true).structuredOutput;
        officialDefinition.gs1KeyCode = Object.keys(structuredObject.identifiers[0])[0];
        officialDefinition.gs1KeyValue = structuredObject.identifiers[0][officialDefinition.gs1KeyCode];
    }
    catch (err)
    {
        logThis("getGS1DigitalLinkToolkitDefinition error: ", err);
        officialDefinition.SUCCESS = false;
    }
    return officialDefinition;
};


module.exports = { getGS1DigitalLinkToolkitDefinition, logThis };