const http = require('http');
const GS1DigitalLinkToolkit = require('./GS1DigitalLinkToolkit');

const port = process.env.PORT || 80;
const gs1dlt = new GS1DigitalLinkToolkit();

/**
 * Calculates the processing time for a request
 * @param processStartTime
 * @returns {number}
 */
const calculateProcessingTime = (processStartTime) => {
  const processEndTime = new Date().getTime();
  return processEndTime - processStartTime;
};

/**
 * requestHandler processes incoming requests to the Digital Link Toolkit Service
 * @param request
 * @param response
 * @returns {Promise<void>}
 */
const requestHandler = async (request, response) => {
  const processStartTime = new Date().getTime();

  const httpHeaders = {
    Vary: 'Accept-Encoding',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'HEAD, GET, OPTIONS',
    'Access-Control-Expose-Headers': 'Link, Content-Length',
    'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
    'Content-Type': 'application/json',
  };

  // If the request has come from the outside world (principally, the data entry UI) it will have an additional
  // '/dltoolkit' at the start of the URI. Internal requests from other container applications in the Docker
  // composition of K8s cluster won't have this.
  const urlParameterArray = request.url.replace('/dltoolkit', '').split('/');
  const dlFunction = urlParameterArray[1].toLowerCase();

  if (dlFunction === 'analyseuri') {
    try {
      const uriStem = request.url.replace(`/${dlFunction}`, '');
      const result = {
        data: gs1dlt.analyseURI(uriStem, true).structuredOutput,
        result: 'OK',
      };

      // If the uriStem is compressed, calling analyseUri will return an empty string but not
      // thrown an exception. So if we reach here with an empty string in result.data then
      // let's have another go by calling the decompression function:
      if (result.data === '') {
        result.data = gs1dlt.decompressGS1DigitalLinkToStructuredArray(uriStem, '');
      }

      httpHeaders['X-Resolver-ProcessTimeMS'] = calculateProcessingTime(processStartTime);
      response.writeHead(200, httpHeaders);
      response.end(JSON.stringify(result));
      console.log(request.url, ' ===> analyseuri OK');
    } catch (err) {
      const errorResponse = {
        result: 'ERROR',
        data: err.toString(),
      };
      response.writeHead(400, httpHeaders);
      response.end(JSON.stringify(errorResponse));
      console.log(request.url, ' ===> analyseuri ERROR ===>', errorResponse.data);
    }
  } else if (dlFunction === 'compress') {
    try {
      const result = {
        data: gs1dlt.compressGS1DigitalLink(request.url.replace(`/${dlFunction}`, ''), false, 'https://id.gs1.org', false, true, false),
        result: true,
      };
      httpHeaders['X-Resolver-ProcessTimeMS'] = calculateProcessingTime(processStartTime);
      response.writeHead(200, httpHeaders);
      response.end(JSON.stringify(result));
      console.log(request.url, ' ===> compress OK');
    } catch (err) {
      const errorResponse = {
        result: 'ERROR',
        data: err.toString(),
      };
      response.writeHead(400, httpHeaders);
      response.end(JSON.stringify(errorResponse));
      console.log(request.url, ' ===> compress ERROR ===>', errorResponse.data);
    }
  } else if (dlFunction === 'decompress' || dlFunction === 'uncompress') {
    try {
      const result = {
        data: gs1dlt.decompressGS1DigitalLinkToStructuredArray(request.url.replace(`/${dlFunction}`, '')),
        result: true,
      };
      httpHeaders['X-Resolver-ProcessTimeMS'] = calculateProcessingTime(processStartTime);
      response.writeHead(200, httpHeaders);
      response.end(JSON.stringify(result));
      console.log(request.url, ' ===> decompress/uncompress OK');
    } catch (err) {
      const errorResponse = {
        result: 'ERROR',
        data: err.toString(),
      };
      response.writeHead(400, httpHeaders);
      response.end(JSON.stringify(errorResponse));
      console.log(request.url, ' ===> decompress/uncompress ERROR ===>', errorResponse.data);
    }
  } else if (dlFunction === 'ailookup') {
    let wantedValue;
    try {
      const aiValue = urlParameterArray[2].toLowerCase();
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(aiValue)) {
        const aiEntry = gs1dlt.aitable.find((entry) => entry.shortcode === aiValue);
        wantedValue = aiEntry.ai;
      } else {
        const aiEntry = gs1dlt.aitable.find((entry) => entry.ai === aiValue);
        wantedValue = aiEntry.shortcode;
      }

      const responseObject = {
        data: wantedValue,
        result: 'OK',
      };

      httpHeaders['X-Resolver-ProcessTimeMS'] = calculateProcessingTime(processStartTime);
      response.writeHead(200, httpHeaders);
      response.end(JSON.stringify(responseObject));
      console.log(request.url, ' ===> ailookup OK');
    } catch (err) {
      const errorResponse = {
        result: 'ERROR',
        data: err.toString(),
      };
      response.writeHead(400, httpHeaders);
      response.end(JSON.stringify(errorResponse));
      console.log(request.url, ' ===> ailookup ERROR ===>', errorResponse.data);
    }
  } else {
    console.log(`Unknown command: ${dlFunction}`);
    response.end(`{ "ERROR": "Unknown command: ${dlFunction}" }`);
  }
};

/**
 * This function sets up the HTTP listening service.
 * @type {Server}
 */
const server = http.createServer(requestHandler);
server.listen(port, async (err) => {
  if (err) {
    console.log('Error:', err);
  } else {
    console.log(`GS1 DigitalLink Toolkit Server listening on port ${port}`);
  }
});

/**
 * These functions exist to shut down the service gracefully when a SIGTERM from Docker Engine or Kubernetes is received.
 */
const serverShutDown = async () => {
  console.info('Digital Link Toolkit Server - Shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', async () => serverShutDown());
