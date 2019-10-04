function getStructure(uri)
{
    const GS1DigitalLinkToolkit = require("./GS1DigitalLinkToolkit");
    let gs1dlt = new GS1DigitalLinkToolkit();
    try
    {
        let structuredObject = gs1dlt.analyseURI(uri, true).structuredOutput;
        structuredObject.error = "OK";
        return (JSON.stringify(structuredObject));
    }
    catch(err)
    {
        let errorObject = {};
        errorObject.error = err;
        console.log(errorObject);
        return (JSON.stringify(errorObject));
    }
}

console.log(getStructure("https://id.gs1.org" + process.argv[2]));
