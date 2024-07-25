import GS1DigitalLinkToolkit from "./GS1DigitalLinkToolkit.js";

const gs1dlt = new GS1DigitalLinkToolkit();
try
{
    let basicStem = process.argv[2];
    if (!basicStem.startsWith('/'))
    {
        basicStem = '/' + basicStem;
    }
    const uriStem = 'https://example.org' + basicStem;
    const compress = process.argv[3] === 'compress';
    let result = {};
    if (!compress)
    {
        result = gs1dlt.analyseURI(uriStem, true).structuredOutput;
        if (typeof result === 'string')
        {
            if (result.trim().length > 0)
            {
                result = JSON.parse(result);
            }
            else
            {

                result = {};
            }
        }
    }
    else
    {
        result['COMPRESSED'] = gs1dlt.compressGS1DigitalLink(uriStem, false, 'https://example.org', false, false, true);
        result['COMPRESSED'] = result['COMPRESSED'].replace('https://example.org', '').trim();
    }
    result['SUCCESS'] = !!result['identifiers'] || !!result['COMPRESSED'];
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}
catch (e)
{
    const result = {
        'SUCCESS': false,
        'ERROR': e.message
    };

    console.log(result);
    process.exit(1);
}
