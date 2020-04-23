const global_GS1dlt = new GS1DigitalLinkToolkit();

const global_dataColumns  = ["gs1_key_code","gs1_key_value","item_description","variant_uri","linktype",
    "iana_language","context", "mime_type","link_title","target_url","default_linktype",
    "default_iana_language","default_context","default_mime_type","fwqs","active",
    "date_inserted","date_last_updated"];

const downloadData = async () =>
{
    let entriesArray = [];
    let authKey = document.getElementById("authKey").value;
    if (authKey === "")
    {
        window.alert("Please paste in your authentication key to continue!");
        return;
    }

    const fetchParameters = {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authKey}`,
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    };

    let divStatus = document.getElementById("divStatus");
    divStatus.innerText = `Getting entry count`;

    let fetchResponse = await fetch('/api/request/count/all', fetchParameters);

    if (fetchResponse.status === 200)
    {
        const countResult = await fetchResponse.json();
        let countSoFar = 0;
        let percentProgress = 0;
        let currentLowestUriRequestId = countResult.lowestUriRequestId;
        let finishedDownloadFlag = false;

        if (countResult.count > 0)
        {
            divStatus.innerText = `Count of entries to download: ${countResult.count} - starting download...`;

            while (!finishedDownloadFlag && fetchResponse.status === 200)
            {
                fetchResponse = await fetch(`/api/request/lowestid/${currentLowestUriRequestId}/maxrows/10`, fetchParameters);
                if (fetchResponse.status === 200)
                {
                    //Convert the received JSON into an entries array object:
                    let entries = await fetchResponse.json();

                    //Add the entries into a master array
                    for(let entry of entries)
                    {
                        entriesArray.push(entry);
                    }

                    countSoFar += entries.length;
                    percentProgress = Math.round(countSoFar * 100 / countResult.count);
                    currentLowestUriRequestId = Number(entries[entries.length - 1].uri_request_id) + 1;

                    //if currentLowestUriRequestId is not a number, we've reached the end.
                    if (isNaN(currentLowestUriRequestId))
                    {
                        finishedDownloadFlag = true;
                    }

                    divStatus.innerText = `Entries to download: ${countSoFar} of ${countResult.count} (${percentProgress}%) ...`;
                }
                else if (fetchResponse.status === 404)
                {
                    //If we get a 404, there is no more data to download (the currentLowestUriRequestId value is higher than
                    //any request ids for this authorised account, so none have been found.
                    finishedDownloadFlag = true;
                }
                else
                {
                    divStatus.innerText = `Error ${fetchResponse.status} while downloading ${countSoFar} of ${entriesArray.length} (${percentProgress}%) ... download stopped`;
                    break;
                }
            }

            if (finishedDownloadFlag)
            {
                divStatus.innerText = `Download completed ${entriesArray.length} entries downloaded`;
                const blobArray = new Blob([convertResolverJSONToCSV(entriesArray)], {type : 'text/plain'});
                document.getElementById('downloadLink').href = window.URL.createObjectURL(blobArray);
                document.getElementById('divDownload').style.visibility = "visible";
            }
        }
    }
};


/**
 * Converts a numeric GS1 Identifier Into its text equivalent.
 * If the incoming value is not a number, just returns it!
 * @param aiNumeric
 * @returns {string}
 */
const convertNumericAIToLabel = (aiNumeric) =>
{
    let aiLabel = aiNumeric;
    if(!isNaN(aiNumeric))
    {
        for (let aiEntry of global_GS1dlt.aitable)
        {
            if (aiEntry.ai === aiNumeric)
            {
                aiLabel = aiEntry.label;
                break;
            }
        }
    }
    return aiLabel.toLowerCase();
}



function createHeaderLine()
{
    let headerLine = '';
    for(let dataColumnNumber in global_dataColumns)
    {
        if(dataColumnNumber < global_dataColumns.length - 1)
        {
            headerLine += `"${global_dataColumns[dataColumnNumber]}",`;
        }
        else
        {
            //Without the final comma
            headerLine += `"${global_dataColumns[dataColumnNumber]}"`;
        }
    }
    return headerLine;
}


function convertResolverJSONToCSV(dataArray)
{
    let csvFile = createHeaderLine() + '\n';

    for(let entry of dataArray)
    {
        let fullCSVLine = "";
        let entryCSVRequestLine = "";
        entryCSVRequestLine = `"${convertNumericAIToLabel(entry.gs1_key_code)}","${entry.gs1_key_value}",`;
        entryCSVRequestLine += `"${entry.item_description}","${entry.variant_uri}",`;

        for(let response of entry.responses)
        {
            fullCSVLine = entryCSVRequestLine;
            fullCSVLine += `"${response.linktype}","${response.iana_language}","${response.context}","${response.mime_type}","${response.link_title}","${response.target_url}",`;
            fullCSVLine += `"${response.default_linktype ? 'Y' : 'N'}","${response.default_iana_language ? 'Y' : 'N'}","${response.default_context ? 'Y' : 'N'}",`;
            fullCSVLine += `"${response.default_mime_type ? 'Y' : 'N'}","${response.forward_request_querystrings ? 'Y' : 'N'}","${response.active ? 'Y' : 'N'}",`;
            fullCSVLine += `"${entry.date_inserted}","${entry.date_last_updated}"\n`;
            csvFile += fullCSVLine;
        }
    }

    return csvFile;
}