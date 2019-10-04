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

const http = require('http');
const port = process.argv[2]; //The argument is the port number provides by  "digilink_toolkit_servers_run.sh"

const requestHandler = (request, response) =>
{
    response.writeHead(200, {'Content-Type': 'application/json'});
    if(request.url === "/stop")
    {
        response.end("{Response: Shutdown}");
        process.exit();
    }
    else if(request.url === "/status")
    {
        response.end("{Response: Running}");
    }
    else
    {
        response.end(getStructure("https://id.gs1.org" + request.url));
    }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) =>
{
    if (err)
    {
        return console.log('something bad happened', err)
    }

    console.log(`DigitalLink Toolkit server is listening on ${port}`)
});