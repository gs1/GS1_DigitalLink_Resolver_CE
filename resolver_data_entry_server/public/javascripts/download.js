const global_GS1dlt = new GS1DigitalLinkToolkit();
const global_dataColumns  = [
    "identificationKeyType",
    "identificationKey",
    "itemDescription",
    "qualifierPath",
    "linkType",
    "ianaLanguage",
    "context",
    "mimeType",
    "linkTitle",
    "targetUrl",
    "defaultLinktype",
    "defaultIanaLanguage",
    "defaultContext",
    "defaultMimeType",
    "fwqs",
    "active",
    "dateInserted",
    "dateLastUpdated"
];
let global_linesDownloadedCount = 0;

/**
 * Allows the use to see the auth key they have typed into the authentication key textbox:
 * (works with mouseOutPass())
 */
const mouseOverPass = () =>
{
    const obj = document.getElementById('authKey');
    obj.type = "text";
}

/**
 * Hides the auth key in the authentication key textbox
 * (works with mouseOverPass())
 */
const mouseOutPass = () =>
{
    const obj = document.getElementById('authKey');
    obj.type = "password";
}

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

    let fetchResponse = await fetch('/resolver/all/count', fetchParameters);

    if (fetchResponse.status === 200)
    {
        const countResult = await fetchResponse.json();
        let countSoFar = 0;
        let percentProgress = 0;
        let currentPageNumber = 1;
        let finishedDownloadFlag = false;

        if (countResult.count > 0)
        {
            divStatus.innerText = `Count of entries to download: ${countResult.count} - starting download...`;

            while (!finishedDownloadFlag && fetchResponse.status === 200)
            {
                fetchResponse = await fetch(`/resolver/all/page/${currentPageNumber}/size/100`, fetchParameters);
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
                    currentPageNumber++;

                    //if currentPageNumber is not a number, we've reached the end.
                    if (isNaN(currentPageNumber))
                    {
                        finishedDownloadFlag = true;
                    }

                    divStatus.innerText = `Entries to download: ${countSoFar} of ${countResult.count} (${percentProgress}%) ...`;
                }
                else if (fetchResponse.status === 404)
                {
                    //If we get a 404, there is no more data to download (the currentPageNumber value is higher than
                    //any entry ids for this authorised account, so none have been found.
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
                const blobArray = new Blob([convertResolverJSONToCSV(entriesArray)], {type : 'text/plain'});
                divStatus.innerText = `Download completed - ${entriesArray.length} entries downloaded and converted into ${global_linesDownloadedCount} CSV lines`;
                document.getElementById('downloadLink').href = window.URL.createObjectURL(blobArray);
                document.getElementById('divDownload').style.visibility = "visible";
            }
        }
        else
        {
            divStatus.innerText = `You have no entries to download!`;
        }
    }
    else
    {
        divStatus.innerText = `Server error code ${fetchResponse.status} trying to download your entries. Please try again.`;
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
        const aiEntry = global_GS1dlt.aitable.find(entry => entry.ai === aiNumeric);
        aiLabel = aiEntry.shortcode;
    }
    return aiLabel;
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
    global_linesDownloadedCount = 0;
    let csvFile = createHeaderLine() + '\n';

    for(let entry of dataArray)
    {
        let fullCSVLine = "";
        let entryCSVEntryLine = "";
        entryCSVEntryLine = `"${convertNumericAIToLabel(entry.identificationKeyType)}","${entry.identificationKey}",`;
        entryCSVEntryLine += `"${entry.itemDescription}","${entry.qualifierPath}",`;

        for(let response of entry.responses)
        {
            fullCSVLine = entryCSVEntryLine;
            fullCSVLine += `"${response.linkType}","${response.ianaLanguage}","${response.context}","${response.mimeType}","${response.linkTitle}","${response.targetUrl}",`;
            fullCSVLine += `"${response.defaultLinkType ? 'Y' : 'N'}","${response.defaultIanaLanguage ? 'Y' : 'N'}","${response.defaultContext ? 'Y' : 'N'}",`;
            fullCSVLine += `"${response.defaultMimeType ? 'Y' : 'N'}","${response.fwqs ? 'Y' : 'N'}","${response.active ? 'Y' : 'N'}",`;
            fullCSVLine += `"${entry.dateInserted}","${entry.dateLastUpdated}"\n`;
            csvFile += fullCSVLine;
            global_linesDownloadedCount++;
        }
    }

    return csvFile;
}