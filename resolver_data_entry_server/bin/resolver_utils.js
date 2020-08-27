//This script file is to hold any common utility functions used across two or more of the other scripts
const GS1DigitalLinkToolkit = require('../public/javascripts/GS1DigitalLinkToolkit');
const dlToolkit = new GS1DigitalLinkToolkit();
const fetch = require('node-fetch');

/**
 * Tests if the language incoming to the API matches the legal set of IANA languages.
 * Note that it must be lowercase - uppercase language alpha2s are not allowed and will return false.
 * @param language
 * @returns {boolean}
 */
const isValidIANALanguage = (language) =>
{
    const result = global['iana_language_array'].find(value => value.alpha2 === language);
    return result !== undefined;
};


/**
 * Tests if the mediaType incoming to the API matches the 'legal' set of media MIME types
 * @param mediaType
 * @returns {boolean}
 */
const isValidMediaType = (mediaType) =>
{
    const result = global['media_types_array'].find(value => value["Media Type"] === mediaType);
    return result !== undefined;
};




/**
 * Run by a daemon service to update the global linkTypesArray list (runs once every 24 hours).
 * @returns {Promise<void>}
 */
const getLinkTypesFromGS1 = async () =>
{
    logThis("Updating Linktypes from GS1");
    try
    {
        let fetchResponse = await fetch('https://www.gs1.org/voc/?show=linktypes', {
            method: 'get',
            headers: {'Accept': 'application/json'},
        });

        if (fetchResponse.status === 200)
        {
            global['linkTypesArray'] = [];
            const linkTypesList = await fetchResponse.json();
            for (let [key, value] of Object.entries(linkTypesList))
            {
                //Save this linkType for future use in the checking process.
                //Both formats for linktypes are saved as both are compatible:
                global['linkTypesArray'].push(
                    {
                        title: value.title,
                        description: value.description,
                        curie: `gs1:${key}`,
                        url: `https://gs1.org/voc/${key}`
                    });
            }
            logThis("Updating Linktypes from GS1 completed successfully");
        }
        else
        {
            logThis(`getLinkTypesFromGS1: Updating Linktypes from GS1 failed with HTTP ${fetchResponse.status}`);
        }
    }
    catch (e)
    {
        logThis(`getLinkTypesFromGS1: Updating Linktypes from GS1 failed with error: ${err}`);
    }
}


/**
 * Logs incoming text to the console with a date/time stamp
 * @param textToLog
 */
const logThis = (textToLog) =>
{
    console.log((new Date()).toUTCString() + " >> " + textToLog)
};

module.exports = { logThis };


const getGS1DigitalLinkToolkitDefinition = (identificationKeyType, identificationKey) =>
{
    let officialDefinition = { identificationKeyType: "", identificationKey: "", SUCCESS: true };
    try
    {
        const uriToTest = `https://id.gs1.org/${identificationKeyType}/${identificationKey}`;
        const structuredObject = dlToolkit.analyseURI(uriToTest, true).structuredOutput;
        officialDefinition.identificationKeyType = Object.keys(structuredObject.identifiers[0])[0];
        officialDefinition.identificationKey = structuredObject.identifiers[0][officialDefinition.identificationKeyType];
    }
    catch (err)
    {
        logThis(`getGS1DigitalLinkToolkitDefinition error: ${err}`);
        officialDefinition.SUCCESS = false;
    }
    return officialDefinition;
};


/**
 * Converts a text GS1 Identifier Into its numeric equivalent.
 * If the incoming value is a number, just returns it!
 * @param aiLabel
 * @returns {string}
 */
const convertAILabelToNumeric = (aiLabel) =>
{
    let aiNumeric = aiLabel;
    let aiLabelLowerCase = aiLabel.toLowerCase();
    if(isNaN(aiNumeric))
    {
        const aiEntry = dlToolkit.aitable.find(entry => entry.shortcode === aiLabelLowerCase);
        aiNumeric = aiEntry.ai;
    }
    return aiNumeric;
}


/**
 * Converts a numeric GS1 Identifier Into its label (shortcode) equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiLabel
 * @returns {string}
 */
const convertAINumericToLabel = (aiNumeric) =>
{
    if(!isNaN(aiNumeric))
    {
        const aiEntry = dlToolkit.aitable.find(entry => entry.ai === aiNumeric);
        return aiEntry.shortcode;
    }
    return aiNumeric;
}


module.exports = {
    isValidIANALanguage,
    isValidMediaType,
    getGS1DigitalLinkToolkitDefinition,
    convertAILabelToNumeric,
    convertAINumericToLabel,
    getLinkTypesFromGS1,
    logThis
};