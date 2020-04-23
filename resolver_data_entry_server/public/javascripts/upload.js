const global_dataColumns = [
    "gs1_key_code", "gs1_key_value", "item_description", "variant_uri", "linktype",
    "iana_language", "context", "mime_type", "link_title", "target_url", "default_linktype",
    "default_iana_language", "default_context", "default_mime_type", "fwqs", "active",
    "date_inserted", "date_last_updated"
];
let global_dataLines = null;

const global_GS1dlt = new GS1DigitalLinkToolkit();

//This variable will store all the pars of request and response objects that will be uploaded
//if checks are successful:
let global_ResolverEntries = [];

const readFile = (input) =>
{
    let divStatus = document.getElementById("divStatus");

    let file = input.files[0];
    let reader = new FileReader();
    reader.readAsText(file);

    reader.loadstart = function ()
    {
        divStatus.innerText = `Reading file ${file.name} - please wait`;
    };

    reader.onload = async function (e)
    {
        global_dataLines = e.target.result.split("\n");
        divStatus.innerText = `File ${file.name} read successfully! Processing ${global_dataLines.length} lines.`;
        showDataFromFile();
        //Set up the list of linktypes select control
        setTimeout(populateLinkTypesSelectControl, 500);
    };


    reader.onerror = function ()
    {
        divStatus.innerText = `Error reading file ${file.name} - error is: ${reader.error}`;

        console.log(reader.error);
    };
};


/**
 * Shows a table with example data which the user uses to select which one contains 'required' columns
 */
const showDataFromFile = () =>
{
    let htmlTable = "<table>";
    let counter = 0;
    let firstColumnFlag = true;
    let detectedDataFlag = false; //Set true when a data line rather than a header line is detected.

    let selectHeaderLines = document.getElementById("selectIgnoreFirstRowCount");

    for (let dataLine of global_dataLines)
    {
        //Create table columns
        //First, aim to split on "," where all columns are double-quoted.
        let dataColumns = dataLine.split('","');
        if (dataColumns.length === 1)
        {
            //Looks like columns are not separated by ",", so try it with just a comma:
            dataColumns = dataLine.split(',');
        }

        //Attempt to detect if this line is a header line. If it has the beginnings of a web address
        //then it is somewhat unlikely! If the detectedDataFlag is true because it previously found
        //a data line then don't don't detect again.
        if (!detectedDataFlag && (dataLine.includes('http://') || dataLine.includes('https://')))
        {
            selectHeaderLines.value = counter; //counter is still 1 behind the current line number
            detectedDataFlag = true; //data line not header line has been detected.
        }

        //This section only runs only on the first column, which is is usually a headers column.
        if (firstColumnFlag)
        {
            htmlTable += "<tr>";
            for (let dataColumnIndex in dataColumns)
            {
                htmlTable += "<td>" + attributesListAsSelectControlHTMLSource(dataColumnIndex) + "</td>";
            }
            htmlTable += "</tr>";
            firstColumnFlag = false;

            //See if we can detect that this is a file in the same format as the download file.
            if (detectOfficialDownloadFormat(dataLine))
            {
                //If so, set all the select controls automatically using this function
                //which will be sent into the event loop so that all the controls actaslly
                //exist by the time they need to be set!
                setTimeout(setSelectControlsToDownloadFileFormat, 1000);
            }
        }

        //Now show the rest of the rows up to a maximum of 5:
        htmlTable += "<tr>";
        for (let dataColumn of dataColumns)
        {
            htmlTable += `<td>${cleanDataColumn(dataColumn)}</td>`;
        }
        htmlTable += "</tr>";

        counter += 1;

        //Break after 5 rows
        if (counter === 5)
        {
            break;
        }
    }

    //Finish off the data display table:
    htmlTable += "</table>";
    document.getElementById("divDataTable").innerHTML = htmlTable;
    document.getElementById("divExtraInfo").style.visibility = "visible";
    document.getElementById("divPerformCheck").style.visibility = "visible";
};


/**
 * Populates the list of LinkTypes from an API call to /api/ref/linktypes
 * @returns {Promise<void>}
 */
const populateLinkTypesSelectControl = async () =>
{
    console.log("Populating link types");
    let selectDefaultLinkType = document.getElementById("selectDefaultLinkType");
    const fetchResponse = await fetch("/api/ref/linktypes");
    if (fetchResponse.status === 200)
    {
        const linkTypesList = await fetchResponse.json();
        for (let [key, value] of Object.entries(linkTypesList))
        {
            let linkTypeOption = document.createElement("option");
            linkTypeOption.value = `https://gs1.org/voc/${key}`;
            linkTypeOption.text = value['title'];
            if (key === "pip")
            {
                linkTypeOption.selected = true;
            }
            selectDefaultLinkType.add(linkTypeOption);
            //console.log(key, value);
        }

        setDefaultLinkTitle();
    }
}


/**
 * Called from the Linktypes select control in HTML, this sets the setDefaultLinkTitle textbox
 * to the select text value:
 */
const setDefaultLinkTitle = () =>
{
    const select = document.getElementById("selectDefaultLinkType");
    const linkTypeText = select.options[select.selectedIndex].text;
    document.getElementById("defaultLinkText").value = linkTypeText;
}


/**
 * Cleans up the value in a data column by removing any double quotes, single quotes, line and cariiage return
 * characters, and superfluous spaces
 * @param dataColumn
 * @returns {string}
 */
const cleanDataColumn = (dataColumn) =>
{
    return dataColumn.replace("\n", "").replace("\r", "").replace('"', '').replace('"', '').trim();
};


/**
 * Creates the HTML SELECT control which will be shown at the top of every column
 * so the user can select the data type for that column. The column number is passed
 * to this function in order to uniquely identify the select control.
 */
const attributesListAsSelectControlHTMLSource = (selectControlNumber) =>
{
    let htmlSelect = `<select id="SELECTCOLUMN_${selectControlNumber}">`;
    htmlSelect += '<option value="X">* Choose column type *</option>';
    htmlSelect += '<option value="< IGNORE >">IGNORE</option>';
    htmlSelect += '<option value="X">-----</option>';
    htmlSelect += '<option value="gs1_key_code">GS1 Key Code</option>';
    htmlSelect += '<option value="gs1_key_value">GS1 Key Value</option>';
    htmlSelect += '<option value="variant_uri">Variant URI</option>';
    htmlSelect += '<option value="X">-----</option>';
    htmlSelect += '<option value="item_description">Item Description</option>';
    htmlSelect += '<option value="X">-----</option>';
    htmlSelect += '<option value="target_url">Target URL</option>';
    htmlSelect += '<option value="link_title">Link Title</option>';
    htmlSelect += '<option value="X">-----</option>';
    htmlSelect += '<option value="linktype">LinkType</option>';
    htmlSelect += '<option value="iana_language">Language</option>';
    htmlSelect += '<option value="context">Context</option>';
    htmlSelect += '<option value="mime_type">MIME Type</option>';
    htmlSelect += '<option value="X">-----</option>';
    htmlSelect += '<option value="default_linktype">Default LinkType (Y/N)</option>';
    htmlSelect += '<option value="default_iana_language">Default Language (Y/N)</option>';
    htmlSelect += '<option value="default_context">Default Context (Y/N)</option>';
    htmlSelect += '<option value="default_mime_type">Default MIME-Type (Y/N)</option>';
    htmlSelect += '<option value="fwqs">Forward QueryStrings (Y/N)</option>';
    htmlSelect += '<option value="active">Make Active (Y/N)</option>';
    htmlSelect += "</select>";
    return htmlSelect
};


/**
 * Detects if the file to upload is in the same format as the file created by the download page.
 * If true, this will be used by another function to preset the select controls
 * @param dataLine
 * @returns {boolean}
 */
const detectOfficialDownloadFormat = (dataLine) =>
{
    let csvFile = '';
    for (let dataColumnNumber in global_dataColumns)
    {
        if (dataColumnNumber < global_dataColumns.length - 1)
        {
            csvFile += `"${global_dataColumns[dataColumnNumber]}",`;
        }
        else
        {
            //Without the final comma
            csvFile += `"${global_dataColumns[dataColumnNumber]}"`;
        }
    }

    return csvFile === dataLine; //returns true if the two headers match
};


/**
 * If the file to upload has been assessed as being in 'download' format, auto-set the various
 * select controls to help the user:
 */
const setSelectControlsToDownloadFileFormat = () =>
{
    //Set the header lines control to 1 (a single header line)
    let headerLinesControl = document.getElementById('selectIgnoreFirstRowCount');
    headerLinesControl.value = "1";

    for (let selectControlNumber = 0; selectControlNumber < global_dataColumns.length; selectControlNumber++)
    {
        let selectControl = document.getElementById(`SELECTCOLUMN_${selectControlNumber}`);
        if (global_dataColumns[selectControlNumber].startsWith("date"))
        {
            selectControl.value = '< IGNORE >';
        }
        else
        {
            selectControl.value = global_dataColumns[selectControlNumber];
        }
    }
};


/**
 * Loop through all indexed instances of the Select control SELECTCOLUMN_(n)
 * looking for values set to 'X' or until we run out of controls
 * @returns {boolean}
 */
const checkAllSelectControlsHaveBeenSet = () =>
{
    let nextSelectControlFlag = true;
    let controlNotSetFlag = false;
    let columnIndex = 0;
    while (nextSelectControlFlag)
    {
        let columnTypeSelectControl = document.getElementById(`SELECTCOLUMN_${columnIndex}`);
        if (columnTypeSelectControl === null)
        {
            nextSelectControlFlag = false;
        }
        else if (columnTypeSelectControl.value === "X")
        {
            controlNotSetFlag = true;
            break
        }
        columnIndex++;
    }
    return controlNotSetFlag;
};


/**
 * Checks the incoming data
 */
const checkData = async () =>
{
    let dataOKFlag = true;
    let divCheckResults = document.getElementById("divCheckResults");
    divCheckResults.innerHTML = "Checking...</br>";
    //empty out he global array of entries:
    global_ResolverEntries = [];

    //First check all select controls have been set. If any values are 'X' it
    //means that some controls have not been set.
    if (checkAllSelectControlsHaveBeenSet())
    {
        window.alert("You need to set all the column description dropdown boxes to a value (even if it is 'IGNORE') before continuing!");
        return;
    }
    let counter = 0;

    let ignoreRowCount = Number(document.getElementById("selectIgnoreFirstRowCount").value);

    for (let dataLine of global_dataLines)
    {
        //Counter is incremented at the start of this loop since some code within the loop can
        //execute a 'continue' which jumps execution back up to here:
        counter += 1;

        //if we have essentially an empty line, or one that starts with a comment # or // tag, ignore it and move on.
        if (dataLine.trim().length < 20 || dataLine.startsWith("#") || dataLine.startsWith("//"))
        {
            continue;
        }


        //Create resolverRequest and resolverResponse objects ready to be populated:
        {
            let resolverRequest = {
                "gs1KeyCode": "",
                "gs1KeyValue": "",
                "itemDescription": "",
                "variantUri": "/",
                "active": true
            };

            let resolverResponse = {
                "uriRequestId": 0,
                "linkType": "",
                "ianaLanguage": "xx",
                "context": "xx",
                "mimeType": "",
                "linkTitle": "",
                "targetUrl": "",
                "fwqs": true,
                "active": true,
                "defaultLinkType": true,
                "defaultIanaLanguage": true,
                "defaultContext": true,
                "defaultMimeType": true
            };


            if (counter <= ignoreRowCount)
            {
                console.log("Header line ignored");
                continue; //jump to the next for loop instance
            }

            //First, check if the line has double double-quotes, replacing with single double-quotes, as in:
            // """grai"",""04012345111118"",""RTI Test"",""/"",""https://gs1.org/voc/pip"" ...
            dataLine = dataLine.replace(/"",""/g, '","').replace(/"""/g, '"');

            //Split the line by "," - if that fails, just split on comma
            let dataColumns = dataLine.split('","');
            if (dataColumns.length < 3)
            {
                dataColumns = dataLine.split(',');
            }

            //loop through each column
            for (let dataColumnNumber in dataColumns)
            {
                //Ensures columnIndex is a number (may not be needed)
                let columnIndex = Number(dataColumnNumber);

                //Take dataColumns[columnIndex] and make sure that the column's value has no carriage-return or linefeed,
                //no single-quote, and is trimmed of start/end spaces before adding it to a local variable in this block:
                let dataColumnValue = cleanDataColumn(dataColumns[columnIndex]);

                //Gets the drop down SELECT control for this column
                let columnTypeSelectControl = document.getElementById(`SELECTCOLUMN_${columnIndex}`);

                if (columnTypeSelectControl !== null)
                {
                    //Gets the value selected for this current column set by the drop-down SELECT control
                    //and sees if it can match its value - if so, assigning the data in the column to the
                    //appropriate resolverRequest or resolverResponse object instance:
                    let columnType = columnTypeSelectControl.value;

                    switch (columnType)
                    {
                        case "gs1_key_code":
                            resolverRequest.gs1KeyCode = dataColumnValue.toLowerCase();
                            break;

                        case "gs1_key_value":
                            resolverRequest.gs1KeyValue = dataColumnValue;
                            break;

                        case "variant_uri":
                            //This logic copes with some variants being blank, as end users may not 'get' that
                            //they should be supplying the root variant if no other variant is needed.
                            if (dataColumnValue !== '')
                            {
                                resolverRequest.variantUri = dataColumnValue;
                            }
                            else
                            {
                                resolverRequest.variantUri = '/';
                            }
                            break;

                        case "linktype":
                            resolverResponse.linkType = dataColumnValue;
                            break;

                        case "iana_language":
                            resolverResponse.ianaLanguage = dataColumnValue;
                            break;

                        case "context":
                            resolverResponse.context = dataColumnValue;
                            break;

                        case "mime_type":
                            resolverResponse.mimeType = dataColumnValue;
                            break;

                        case "target_url":
                            resolverResponse.targetUrl = dataColumnValue;
                            break;

                        case "default_linktype":
                            resolverResponse.defaultLinkType = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "default_iana_language":
                            resolverResponse.defaultIanaLanguage = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "default_context":
                            resolverResponse.defaultContext = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "default_mime_type":
                            resolverResponse.defaultMimeType = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "active":
                            resolverResponse.active = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "fwqs":
                            resolverResponse.fwqs = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
                            break;

                        case "item_description":
                            //Note that descriptions can be built from several columns:
                            resolverRequest.itemDescription += " " + dataColumnValue;
                            break;

                        case "link_title":
                            resolverResponse.linkTitle = dataColumnValue;
                            break;
                    }
                }
            }

            //Now perform checks:

            if (resolverRequest.gs1KeyCode === "")
            {
                resolverRequest.gs1KeyCode = document.getElementById("selectGS1KeyCode").value;
                if (resolverRequest.gs1KeyCode === "")
                {
                    divCheckResults.innerHTML += `Line ${counter}: No GS1 Key Code column, and no default value set<p>${dataLine}</p>`;
                    dataOKFlag = false;
                }
            }

            //call into Digital Link toolkit
            const gs1CheckResult = runDigitalLinkCheck(resolverRequest.gs1KeyCode, resolverRequest.gs1KeyValue, resolverRequest.variantUri);
            if (gs1CheckResult.result === "ERROR")
            {
                divCheckResults.innerHTML += `Line ${counter}: ${resolverRequest.gs1KeyCode}, ${resolverRequest.gs1KeyValue}: ${gs1CheckResult.error}<p>${dataLine}</p>`;
                dataOKFlag = false;
            }

            if (resolverResponse.targetUrl === "")
            {
                divCheckResults.innerHTML += `Line ${counter}: No Target URL<p>${dataLine}</p>`;
                dataOKFlag = false;
            }

            if (resolverRequest.itemDescription === "")
            {
                divCheckResults.innerHTML += `Line ${counter}: No Item Description<p>${dataLine}</p>`;
                dataOKFlag = false;
            }

            //Fill in any 'blanks' from the web page selections
            if (resolverResponse.linkType === "")
            {
                resolverResponse.linkType = document.getElementById("selectDefaultLinkType").value;
                if (resolverResponse.linkType === "")
                {
                    divCheckResults.innerHTML += `Line ${counter}: No LinkType column, and no default value set<p>${dataLine}</p>`;
                    dataOKFlag = false;
                }
            }

            if (resolverResponse.mimeType === "")
            {
                resolverResponse.mimeType = document.getElementById("selectMIMEType").value;
                if (resolverResponse.mimeType === "")
                {
                    divCheckResults.innerHTML += `Line ${counter}: No MIME (document) column, and no default value set<p>${dataLine}</p>`;
                    dataOKFlag = false;
                }
            }

            if (resolverResponse.linkTitle === "")
            {
                resolverResponse.linkTitle = document.getElementById("defaultLinkText").value;
                if (resolverResponse.linkTitle === "")
                {
                    divCheckResults.innerHTML += `Line ${counter}: Empty Link Text, and no default value set<p>${dataLine}</p>`;
                    dataOKFlag = false;
                }
            }

            //if we have reached here, the line passed its checks and the data is added to the ready-to-upload
            // resolver entries list:
            if (dataOKFlag)
            {
                global_ResolverEntries.push({resolverRequest, resolverResponse});
            }
        }

    }
    if (dataOKFlag)
    {
        document.getElementById("divPerformCheck").style.visibility = "hidden";
        document.getElementById("divPerformUpload").style.visibility = "visible";
    }
};


/**
 * Consults the Digital Link toolkit to see if the current entry is valis
 * @param gs1KeyCode
 * @param gs1KeyValue
 * @param variantUri
 * @returns {string|{}}
 */
const runDigitalLinkCheck = (gs1KeyCode, gs1KeyValue, variantUri) =>
{
    let uriToTest = `https://id.gs1.org/${gs1KeyCode}/${gs1KeyValue}`;
    if (variantUri.startsWith('/'))
    {
        uriToTest += variantUri;
    }
    else
    {
        //Add a preceding forward-slash
        uriToTest += `/${variantUri}`;
    }

    try
    {
        const structuredObject = global_GS1dlt.analyseURI(uriToTest, true).structuredOutput;
        structuredObject.result = "OK";
        return structuredObject;
    }
    catch (err)
    {
        let errorObject = {};
        errorObject.result = "ERROR";
        errorObject.error = `DigitalLink Toolkit tested -> ${uriToTest} <- and found this issue: '${err.toString()}'`;
        return errorObject;
    }
};


const uploadData = async () =>
{
    let counter = 0;
    let failCount = 0;
    let success = false;
    let authKey = document.getElementById("authKey").value;
    if (authKey === "")
    {
        window.alert("Please paste in your authentication key to continue!");
        return;
    }

    let divUploadResults = document.getElementById("divUploadResults");
    for (let entry of global_ResolverEntries)
    {
        success = false;
        while (!success)
        {
            success = await uploadToAPI(entry.resolverRequest, entry.resolverResponse, authKey);
            if (success)
            {
                counter++;
                divUploadResults.innerText = `Uploaded ${counter} entries...`;
                failCount = 0; //Success so reset the fail counter
            }
            else
            {
                divUploadResults.innerText = `An error occurred uploading entry ${counter} - trying again: ${failCount}`;
                failCount++; //upload attempt failed, adding 1 to the fail count
                await sleepForSeconds(1);
            }

            if (failCount > 10)
            {
                //too many failures - something is seriously wrong at the server end. Stopping the upload.
                divUploadResults.innerText = `An error occurred uploading entry ${counter} - too many failures - stopping upload`;
                return;
            }
        }
    }
    divUploadResults.innerText = `Upload completed`;

};


//Sleep function
const sleepForSeconds = async (seconds) =>
{
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


const uploadToAPI = async (resolverRequest, resolverResponse, authKey) =>
{
    let success = false;
    try
    {
        const fetchParameters = {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authKey}`,
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(resolverRequest)
        };

        //upload the resolverRequest
        let fetchResponse = await fetch('/api/request', fetchParameters);

        if (fetchResponse.status === 200)
        {
            //The resolverRequest was accepted successfully, now send extract the returned uriRequestId and
            //use it in the resolverResponse.
            const requestResult = await fetchResponse.json();
            resolverResponse.uriRequestId = requestResult.uriRequestId;
            fetchParameters.body = JSON.stringify(resolverResponse);

            fetchResponse = await fetch('/api/response', fetchParameters);
            if (fetchResponse.status === 200)
            {
                success = true;
            }
        }
    }
    catch (err)
    {
        console.log(`uploadToAPI error: ${err}`);
    }

    return success;
};
