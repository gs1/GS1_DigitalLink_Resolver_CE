const global_dataColumns = [
  'identificationKeyType',
  'identificationKey',
  'itemDescription',
  'qualifierPath',
  'linkType',
  'ianaLanguage',
  'context',
  'mimeType',
  'linkTitle',
  'targetUrl',
  'defaultLinktype',
  'defaultIanaLanguage',
  'defaultContext',
  'defaultMimeType',
  'fwqs',
  'active',
  'dateInserted',
  'dateLastUpdated',
];

const global_entryResponseStatusCodes = {
  OK: 0,
  INVALID_MO: 100,
  RESOLVER_ENTRY_MISSING_PROPERTIES: 110,
  FAILED_DIGITAL_LINK_TEST: 120,
  INACTIVE_LICENSE_UNDER_MO: 200,
  INVALID_LICENSE_UNDER_MO: 300,
  KEY_NOT_IN_MO_RANGE: 400,
  INVALID_KEY_TYPE: 500,
  KEY_NOT_FOUND: 600,
  FAILED_TO_SAVE_ENTRY: 700,
  FAILED_TO_SAVE_RESPONSE: 800,
  VALIDATION_ATTEMPT_FAILED: 900,
  NOT_YET_VALIDATED: 999,
};

let global_dataLines = [];
const global_upload_batchIds = [];
let global_data_ExcelWorkBook = null;
let global_spreadSheetName = null;
let global_officialGS1Template = false;
let global_linkTypes = [];
let global_languages = [];
let global_contexts = [];
let global_mediaTypes = [];

const global_RegexAtLeast3AlphaNumerics = RegExp('/(.*[a-z]){3}/i');
const global_EMPTYCELL_FLAG = '????????';
const global_UploadBatchSize = 100; // This shows how many entries are uploaded in one batch

// This variable will store all the pars of request and response objects that will be uploaded
// if checks are successful:
let global_ResolverEntries = [];

const convertValidationCodeToText = (validationCode) =>
  Object.keys(global_entryResponseStatusCodes).find((key) => global_entryResponseStatusCodes[key] === parseInt(validationCode));

/**
 * Allows the use to see the auth key they have typed into the authentication key textbox:
 * (works with mouseOutPass())
 */
const mouseOverPass = () => {
  const obj = document.getElementById('authKey');
  obj.type = 'text';
};

/**
 * Hides the auth key in the authentication key textbox
 * (works with mouseOverPass())
 */
const mouseOutPass = () => {
  const obj = document.getElementById('authKey');
  obj.type = 'password';
};

/**
 * Reads the file presented for upload
 * @param input
 */
const readFile = (input) => {
  let fileType;
  const divStatus = document.getElementById('divStatus');

  const file = input.files[0];
  const reader = new FileReader();

  if (file.name.toLowerCase().endsWith('.csv')) {
    fileType = 'CSV';
  } else if (file.name.toLowerCase().endsWith('xlsx')) {
    fileType = 'XLSX';
  } else {
    divStatus.innerText = `${file.name} is not compatible with this upload application - please use text '.csv' or Excel '.xlsx' files`;
    return;
  }

  if (fileType === 'XLSX') {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }

  reader.loadstart = function () {
    divStatus.innerText = `Reading file ${file.name} - please wait`;
  };

  reader.onload = async function (e) {
    // Hide the file uploader
    document.getElementById('divFileUpload').style.visibility = 'hidden';

    if (fileType === 'XLSX') {
      try {
        const data = e.target.result;

        // Read as an Excel Workbook
        global_data_ExcelWorkBook = XLSX.read(data, { type: 'array' });

        // Set the global_officialGS1Template flag to true if this the official GS1 template spreadsheet
        if (
          global_data_ExcelWorkBook.Sheets.Instructions !== undefined &&
          global_data_ExcelWorkBook.Sheets.Instructions.A1 !== undefined &&
          global_data_ExcelWorkBook.Sheets.Instructions.A1.v !== undefined
        ) {
          global_officialGS1Template = global_data_ExcelWorkBook.Sheets.Instructions.A1.v === 'GS1Templatev0.2';
        } else {
          global_officialGS1Template = false;
        }
        divStatus.innerText = `${global_officialGS1Template ? 'Official GS1 Template' : 'Your'} Excel file '${file.name}' was read successfully`;

        // At this point we load the official lists from the official GS1 Template spreadsheet
        if (global_officialGS1Template) {
          loadLanguagesFromOfficialGS1Template();
          loadContextsFromOfficialGS1Template();
          loadMediaTypesFromOfficialGS1Template();

          // We also hide the 'set default key type' setting as we already know it!
          document.getElementById('gs1KeysDefault_Hide_If_Official_Spreadsheet').style.visibility = 'hidden';
        }

        selectExcelSpreadSheet();
      } catch (err) {
        divStatus.innerText = `Spreadsheet ${file.name} could not be read. Please refresh this page and try upload again! Error is: ${err}. `;
      }
    } else {
      global_dataLines = e.target.result.split('\n');
      divStatus.innerText = `File ${file.name} read successfully! Processing ${global_dataLines.length} lines.`;
      showDataFromCSVFile(false);
    }

    // Set up the list of linktypes select control
    setTimeout(populateLinkTypesSelectControl, 500);
  };

  reader.onerror = function () {
    divStatus.innerText = `Error reading file ${file.name} - error is: ${reader.error}`;

    console.log(reader.error);
  };
};

/**
 * Sets up a SELECT control with all the spreadsheet names in this Excel Workbook
 */
const selectExcelSpreadSheet = () => {
  const selectWorkSheet = document.getElementById('selectWorkSheet');
  for (const sheetName of global_data_ExcelWorkBook.SheetNames) {
    // If this spreadsheet is NOT the officia; GS1 template then add all spraadsheet names to the select control
    // OR (as it is the official template) only those names in all capital letters are chosen.
    if (!global_officialGS1Template || sheetName.trim().toUpperCase() === sheetName.trim()) {
      const thisOption = document.createElement('option');
      thisOption.text = sheetName.trim();
      thisOption.value = sheetName.trim();
      selectWorkSheet.appendChild(thisOption);
    }
  }
  // make the spreadsheet chooser visible:
  document.getElementById('divChooseSpreadsheet').style.visibility = 'visible';
};

/**
 * Loads languages from the official GS1 Template spreadsheet
 */
const loadLanguagesFromOfficialGS1Template = () => {
  global_languages = [];
  const langSheet = global_data_ExcelWorkBook.Sheets.Languages;
  for (let row = 1; row < 200; row++) {
    if (langSheet[`A${row}`] && langSheet[`B${row}`]) {
      const ianaLanguage = langSheet[`A${row}`].w;
      const userReadable = langSheet[`B${row}`].w;
      global_languages.push({ iana: ianaLanguage, user: userReadable });
    }
  }
};

/**
 * Loads contexts from the official GS1 Template spreadsheet
 */
const loadContextsFromOfficialGS1Template = () => {
  global_contexts = [];
  const langSheet = global_data_ExcelWorkBook.Sheets.Contexts;
  for (let row = 1; row < 300; row++) {
    if (langSheet[`A${row}`] && langSheet[`B${row}`]) {
      const countryName = langSheet[`A${row}`].w;
      const countryCode = langSheet[`B${row}`].w;
      global_contexts.push({ countryCode, countryName });
    }
  }
};

/**
 * Loads media (MIME) types from the official GS1 Template spreadsheet
 */
const loadMediaTypesFromOfficialGS1Template = () => {
  global_mediaTypes = [];
  const langSheet = global_data_ExcelWorkBook.Sheets.MediaTypes;
  for (let row = 1; row < 100; row++) {
    if (langSheet[`A${row}`] && langSheet[`B${row}`]) {
      const mediaTypeName = langSheet[`A${row}`].w;
      const mimeType = langSheet[`B${row}`].w;
      global_mediaTypes.push({ mimeType, mediaTypeName });
    }
  }
};

/**
 * Shows data from the Excel spreadsheet file
 */
const showDataFromXLSXFile = () => {
  // Now the user has chosen the sheet name, we can make this section invisible:
  document.getElementById('divChooseSpreadsheet').style.visibility = 'hidden';

  // Get the chosen sheetName
  global_spreadSheetName = document.getElementById('selectWorkSheet').value;
  document.getElementById('divStatus').innerHTML = `Spreadsheet chosen: <b>${global_spreadSheetName}</b>`;

  // This array of alphabetic capital letters will be used as an index to the spreadsheet's columns.
  // We don't need to do the same for the spreadsheet's rows because
  const columnNamesArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // The sheetRangeArray stores the active cell range in this wprksheet
  // from 'top-left' to bottom-right, e.g. "A1:R14"
  const sheetRangeArray = global_data_ExcelWorkBook.Sheets[global_spreadSheetName]['!ref'].split(':');

  // using the example "A1:R14", this value will be "A"
  const sheetRangeLowestColumn = sheetRangeArray[0].substr(0, 1);

  // using the example "A1:R14", this value will be "R"
  const sheetRangeHighestColumn = sheetRangeArray[1].substr(0, 1);

  // The official GS1 Template has the starting row as 3
  let sheetRangeLowestRow = 3;
  if (!global_officialGS1Template) {
    // using the example "A1:R14", this value will be 1.
    sheetRangeLowestRow = parseInt(sheetRangeArray[0].substr(1));
  }

  // using the example "A1:R14", this value will be 14
  const sheetRangeHighestRow = parseInt(sheetRangeArray[1].substr(1));

  // This flag will be turned on when we are 'in range'.
  let wantedColumnFlag = false;

  // The lowest to highest rows are numeric so we can use a conventional numeric
  // loop for each row:
  for (let row = sheetRangeLowestRow; row <= sheetRangeHighestRow; row++) {
    let csvRow = '';

    // Columns in Excel are letters, not numbers. The array columnNamesArray stores letters A thru Z
    // in which the active columns can be found.
    for (const column of columnNamesArray) {
      // We have found the lowest column value so we switch on the wantedColumnFlag
      if (column === sheetRangeLowestColumn) {
        wantedColumnFlag = true;
      }

      if (wantedColumnFlag) {
        // This block adds a CSV column to csvRow.
        // If the data in the cell is HELLO then it builds this: "HELLO",
        csvRow += '"';
        const cellId = column + row;
        const cell = global_data_ExcelWorkBook.Sheets[global_spreadSheetName][cellId];

        // Cells which do not have any data are missing in the data, but we need to note that they would
        // have existed to maintain consistency. For example, If there is no CSV for some GTIN entries, the
        // CSV cell for that GTIN's row is empty. But we need to have a placeholder for it so it doesn't shift
        // the next cell's data to the left! For now we mark it with the value in global variable
        // global_EMPTYCELL_FLAG which we will use later to detect intentionally blank data.
        if (cell === undefined || cell.w.trim().length === 0) {
          csvRow += global_EMPTYCELL_FLAG;
        } else {
          // Add the data from the cell
          csvRow += cell.w;
        }
        csvRow += '",';

        // We have reached the top end of columns, se switch off the flag
        if (column === sheetRangeHighestColumn) {
          wantedColumnFlag = false;
        }
      }
    }
    // Add all but the final character from csvRow (which is a comma) to the global_dataLines array.
    // after checking that it is not identical to the previous row (as long as there are more than 0 rows
    // in global_dataLines):
    const csvRowToStore = csvRow.substring(0, csvRow.length - 1);
    if(detectJavaScriptCode(csvRowToStore)) {
      alert('DANGER: JavaScript code detected in file - please remove it and try again');
      return;
    }
      if (csvRowToStore.length > 0 && csvRowToStore !== global_dataLines[global_dataLines.length - 1])
      {
        global_dataLines.push(csvRowToStore);
      }
    }

   // Now we have filled global_dataLines, we run the CSV processing function which expects
  // to find its data there:
  showDataFromCSVFile(global_officialGS1Template);
}

/**
 * This function detects JavaScript code (such as alert() or console commands) in an incoming string, return true if JavaScript id found, else false.
 * WARNING: It is not possible to detect all JavaScript code, so this function is not 100% reliable.
 */
const detectJavaScriptCode = (dataLine) => {
  const jsCode = ['javascript', 'alert', 'console', 'document', 'window', 'eval', 'function', 'form', 'onclick', 'onload', 'onsubmit', 'onerror', 'onbeforeunload', 'onload', 'onunload', 'onchange', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onkeypress', 'onblur', 'onfocus', 'onresize', 'onreset', 'onselect', 'onchange', 'onabort', 'oncontextmenu', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'onerror', 'onfocus', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel', 'onreset', 'onscroll', 'onselect', 'onsubmit', 'onwheel', 'onafterprint', 'onbeforeprint', 'onbeforeunload', 'onhashchange', 'onmessage', 'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpopstate', 'onresize', 'onstorage', 'onunload', 'onblur', 'onchange', 'oncontextmenu', 'onfocus', 'oninput', 'oninvalid', 'onreset', 'onsearch', 'onselect', 'onsubmit'];
  for (const jsCodeItem of jsCode) {
    if (dataLine.trim().toLowerCase().includes(jsCodeItem)) {
      return true;
    }
  }
  return false;
};



/**
 * Shows a table with example data which the user uses to select which one contains 'required' columns
 */
const showDataFromCSVFile = (officialExcelSpreadsheetWasSourceFlag) => {
  let htmlTable = '<table>';
  let counter = 0;
  let firstColumnFlag = true;

  for (const rawDataLine of global_dataLines) {
    // Remove any CR or LF characters (at most one of either/both may occur at the end of each line)
    // so no need for regex search:
    const dataLine = rawDataLine.replace('\n', '').replace('\r', '');
    if(detectJavaScriptCode(dataLine)) {
        alert('DANGER: JavaScript code detected in file - please remove it and try again');
        return;
    }

    // Create table columns
    // First, aim to split on "," where all columns are double-quoted.
    let dataColumns = dataLine.split('","');
    if (dataColumns.length === 1) {
      // Looks like columns are not separated by ",", so try it with just a comma:
      dataColumns = dataLine.split(',');
    }

    // This section only runs only on the first column, which is  usually a headers column.
    if (firstColumnFlag) {
      htmlTable += '<tr>';
      for (let dataColumnIndex = 0; dataColumnIndex < dataColumns.length; dataColumnIndex++) {
        htmlTable += `<td>${attributesListAsSelectControlHTMLSource(dataColumnIndex)}</td>`;
      }
      htmlTable += '</tr>';
      firstColumnFlag = false;

      // See if we can detect that this is a file in the same format as the download file.
      if (officialExcelSpreadsheetWasSourceFlag) {
        setTimeout(setSelectControlsToOfficialExcelFileFormat, 1000);
      } else if (detectOfficialDownloadFormat(dataLine)) {
        // If so, set all the select controls automatically using this function
        // which will be sent into the event loop so that all the controls actaslly
        // exist by the time they need to be set!
        setTimeout(setSelectControlsToDownloadFileFormat, 1000);
      }
    }

    // Now show the rest of the rows up to a maximum of 5:
    htmlTable += '<tr>';
    for (const dataColumn of dataColumns) {
      htmlTable += `<td>${cleanDataColumn(dataColumn)}</td>`;
    }
    htmlTable += '</tr>';

    counter += 1;

    // Break after 5 rows
    if (counter === 5) {
      break;
    }
  }

  // Finish off the data display table:
  htmlTable += '</table>';
  document.getElementById('divDataTable').innerHTML = htmlTable;
  document.getElementById('divExtraInfo').style.visibility = 'visible';
  document.getElementById('divPerformCheck').style.visibility = 'visible';
};

/**
 * Returns true if the data line includes an instance from this Non-exhaustive list
 * of URI schemes most likely to be used in an upload file.
 * This function is used as a simple way of detecting a data line since a target url
 * is a mandatory item of data to upload.
 * @param dataLine
 * @returns {boolean}
 */
const lineIncludesInternetURIScheme = (dataLine) =>
  dataLine.includes('http://') || // unencrypted web address
  dataLine.includes('https://') || // encrypted web address
  dataLine.includes('ftp://') || // file transfer protocol (file download)
  dataLine.includes('sftp://') || // secure file transfer protocol (file download)
  dataLine.includes('rtsp://') || // media streaming protocol
  dataLine.includes('sip:') || // internet telephone number
  dataLine.includes('tel:') || // standard telephone number
  dataLine.includes('mailto:'); // create an email to send

/**
 * Populates the list of LinkTypes from an API call to /reference/linktypes
 * @returns {Promise<void>}
 */
const populateLinkTypesSelectControl = async () => {
  const selectDefaultLinkType = document.getElementById('selectDefaultLinkType');

  try {
    const fetchResponse = await fetch('/reference/linktypes');
    if (fetchResponse.status === 200) {
      global_linkTypes = await fetchResponse.json();
      global_linkTypes.forEach((linkType) => {
        const linkTypeOption = document.createElement('option');
        linkTypeOption.value = linkType.url;
        linkTypeOption.text = linkType.title;
        // linkTypeOption.label = linkType.description;
        selectDefaultLinkType.add(linkTypeOption);
      });
      setDefaultLinkType();
    } else if (fetchResponse.status === 404) {
      // the Fetch API failed (in design mode the page has no access to the API)
      const linkTypeOption = document.createElement('option');
      linkTypeOption.value = 'https://gs1.org/voc/pip';
      linkTypeOption.text = 'Product Information Page';
      linkTypeOption.selected = true;
      selectDefaultLinkType.add(linkTypeOption);
      document.getElementById('defaultLinkType').value = 'Product Information Page';
    }
  } catch (err) {
    // the Fetch API failed (in design mode the page has no access to the API)
    console.log('populateLinkTypesSelectControl error:', err.toString());

    global_linkTypes.push({
      curie: 'gs1:pip',
      description: 'Product Information Page',
      title: 'Product Information Page',
      url: 'https://gs1.org/voc/pip',
    });

    const linkTypeOption = document.createElement('option');
    linkTypeOption.value = 'https://gs1.org/voc/pip';
    linkTypeOption.text = 'Product Information Page';
    linkTypeOption.selected = true;
    selectDefaultLinkType.add(linkTypeOption);
    document.getElementById('defaultLinkText').value = 'Product Information Page';
  }
};

/**
 * Called from the Linktypes select control in HTML, this sets the setDefaultLinkType textbox
 * to the select text value:
 */
const setDefaultLinkType = () => {
  try {
    const select = document.getElementById('selectDefaultLinkType');
    document.getElementById('defaultLinkText').value = select.options[select.selectedIndex].text;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Cleans up the value in a data column by removing any double quotes, single quotes, line and carriage return
 * characters, and trims spaces.
 * If the dataColumn value matches the constant value in global_EMPTYCELL_FLAG, return an empty string.
 * @param dataColumn
 * @returns {string}
 */
const cleanDataColumn = (dataColumn) => dataColumn.replace('\n', '').replace('\r', '').replace(global_EMPTYCELL_FLAG, '').replace('"', '').replace('"', '').trim();

/**
 * Creates the HTML SELECT control which will be shown at the top of every column
 * so the user can select the data type for that column. The column number is passed
 * to this function in order to uniquely identify the select control.
 */
const attributesListAsSelectControlHTMLSource = (selectControlNumber) => {
  let htmlSelect = `<select id="SELECTCOLUMN_${selectControlNumber}">`;
  htmlSelect += '<option value="X">* Choose column type *</option>';
  htmlSelect += '<option value="< IGNORE >">IGNORE</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="identificationKeyType">Id Key Type</option>';
  htmlSelect += '<option value="identificationKey">Identification Key</option>';
  htmlSelect += '<option value="qualifierPath">Qualifier Path</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="itemDescription">Item Description</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="targetUrl">Target URL</option>';
  htmlSelect += '<option value="linkTitle">Link Title</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="cpv">CPV (GTIN)</option>';
  htmlSelect += '<option value="batch">Batch / Lot# (GTIN)</option>';
  htmlSelect += '<option value="serial">Serial# (GTIN)</option>';
  htmlSelect += '<option value="glnx">GLN-X (GLN)</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="linkType">LinkType</option>';
  htmlSelect += '<option value="ianaLanguage">Language</option>';
  htmlSelect += '<option value="context">Context</option>';
  htmlSelect += '<option value="mimeType">MIME Type</option>';
  htmlSelect += '<option value="X">-----</option>';
  htmlSelect += '<option value="defaultLinktype">Default LinkType (Y/N)</option>';
  htmlSelect += '<option value="defaultIanaLanguage">Default Language (Y/N)</option>';
  htmlSelect += '<option value="defaultContext">Default Context (Y/N)</option>';
  htmlSelect += '<option value="defaultMimeType">Default MIME-Type (Y/N)</option>';
  htmlSelect += '<option value="fwqs">Forward QueryStrings (Y/N)</option>';
  htmlSelect += '<option value="active">Make Active (Y/N)</option>';
  htmlSelect += '</select>';
  return htmlSelect;
};

/**
 * Detects if the file to upload is in the same format as the file created by the download page.
 * If true, this will be used by another function to preset the select controls
 * @param dataLine
 * @returns {boolean}
 */
const detectOfficialDownloadFormat = (dataLine) => {
  let csvFile = '';
  for (const dataColumnNumber in global_dataColumns) {
    if (dataColumnNumber < global_dataColumns.length - 1) {
      csvFile += `"${global_dataColumns[dataColumnNumber]}",`;
    } else {
      // Without the final comma
      csvFile += `"${global_dataColumns[dataColumnNumber]}"`;
    }
  }

  return csvFile === dataLine; // returns true if the two headers match
};

/**
 * If the file to upload has been assessed as being in 'download' format, auto-set the various
 * select controls to help the user:
 */
const setSelectControlsToDownloadFileFormat = () => {
  for (let selectControlNumber = 0; selectControlNumber < global_dataColumns.length; selectControlNumber++) {
    const selectControl = document.getElementById(`SELECTCOLUMN_${selectControlNumber}`);
    if (global_dataColumns[selectControlNumber].startsWith('date')) {
      selectControl.value = '< IGNORE >';
    } else {
      selectControl.value = global_dataColumns[selectControlNumber];
    }
  }
};

/**
 * If the file to upload has been assessed as being in 'download' format, auto-set the various
 * select controls to help the user:
 */
const setSelectControlsToOfficialExcelFileFormat = () => {
  for (let selectControlNumber = 0; selectControlNumber < global_dataColumns.length; selectControlNumber++) {
    const selectControl = document.getElementById(`SELECTCOLUMN_${selectControlNumber}`);
    if (selectControl !== undefined && selectControl !== null) {
      if (global_dataColumns[selectControlNumber].startsWith('date')) {
        selectControl.value = '< IGNORE >';
      } else {
        switch (selectControlNumber) {
          case 0:
            selectControl.value = 'identificationKey';
            break;

          case 1:
            selectControl.value = 'itemDescription';
            break;

          case 2:
            selectControl.value = 'targetUrl';
            break;

          case 3:
            selectControl.value = 'linkType';
            break;

          case 4:
            selectControl.value = 'linkTitle';
            break;

          case 5:
            selectControl.value = 'defaultLinktype';
            break;

          case 6:
            selectControl.value = 'cpv';
            break;

          case 7:
            selectControl.value = 'batch';
            break;

          case 8:
            selectControl.value = 'serial';
            break;

          case 9:
            selectControl.value = 'ianaLanguage';
            break;

          case 10:
            selectControl.value = 'context';
            break;

          case 11:
            selectControl.value = 'mimeType';
            break;
        }
      }
    }
  }
};

/**
 * Loop through all indexed instances of the Select control SELECTCOLUMN_(n)
 * looking for values set to 'X' or until we run out of controls.
 * Returns true if all controls are set, else false
 * @returns {boolean}
 */
const checkAllSelectControlsHaveBeenSet = () => {
  let nextSelectControlFlag = true;
  let controlNotSetFlag = false;
  let columnIndex = 0;
  while (nextSelectControlFlag) {
    const columnTypeSelectControl = document.getElementById(`SELECTCOLUMN_${columnIndex}`);
    if (columnTypeSelectControl === null) {
      nextSelectControlFlag = false;
    } else if (columnTypeSelectControl.value === 'X') {
      controlNotSetFlag = true;
      break;
    }
    columnIndex++;
  }
  return !controlNotSetFlag;
};

const buildResolverEntry = (dataColumns, resolverEntry, resolverResponse) => {
  for (let dataColumnNumber = 0; dataColumnNumber < dataColumns.length; dataColumnNumber++) {
    // Take dataColumns[columnIndex] and make sure that the column's value has no carriage-return or linefeed,
    // no single-quote, and is trimmed of start/end spaces before adding it to a local variable in this block:
    const dataColumnValue = cleanDataColumn(dataColumns[dataColumnNumber]);

    // Gets the drop down SELECT control for this column
    const columnTypeSelectControl = document.getElementById(`SELECTCOLUMN_${dataColumnNumber}`);

    if (columnTypeSelectControl !== null) {
      // Gets the value selected for this current column set by the drop-down SELECT control
      // and sees if it can match its value - if so, assigning the data in the column to the
      // appropriate resolverEntry or resolverResponse object instance:
      const columnType = columnTypeSelectControl.value;

      switch (columnType) {
        case 'identificationKeyType':
          resolverEntry.identificationKeyType = dataColumnValue.toLowerCase();
          break;

        case 'identificationKey':
          resolverEntry.identificationKey = dataColumnValue;
          break;

        case 'qualifierPath':
          // Add a preceding '/' if dataColumnValue does not already start with '/'
          resolverEntry.qualifierPath = `${dataColumnValue.startsWith('/') ? '' : '/'}${dataColumnValue}`;
          break;

        // It is important that cpv, batch_lot and serial are in this order for GTIN, and that
        // batch_lot and serial can be appended to any existing qualifierPath data:
        case 'cpv':
          if (dataColumnValue.length > 0) {
            resolverEntry.qualifierPath += `/cpv/${dataColumnValue}`;
          }
          break;

        case 'batch':
          if (dataColumnValue.length > 0) {
            resolverEntry.qualifierPath += `/lot/${dataColumnValue}`;
          }
          break;

        case 'serial':
          if (dataColumnValue.length > 0) {
            resolverEntry.qualifierPath += `/ser/${dataColumnValue}`;
          }
          break;

        // glnx is used by GLN
        case 'glnx':
          if (dataColumnValue.length > 0) {
            resolverEntry.qualifierPath += `/${dataColumnValue}`;
          }
          break;

        case 'linkType':
          resolverResponse.linkType = dataColumnValue;
          break;

        case 'ianaLanguage':
          if (dataColumnValue.length === 2) {
            resolverResponse.ianaLanguage = dataColumnValue;
          } else {
            const findLanguage = global_languages.find((language) => language.user === dataColumnValue.trim());
            if (findLanguage) {
              resolverResponse.ianaLanguage = findLanguage.iana;
            }
          }
          break;

        case 'context':
          // Here we enforce context as a 2-char country / territory in GS1 Resolver
          if (dataColumnValue.length === 2) {
            resolverResponse.context = dataColumnValue;
          } else {
            const findContext = global_contexts.find((language) => language.user === dataColumnValue.trim());
            if (findContext) {
              resolverResponse.context = findContext.iana;
            }
          }
          break;

        case 'mimeType':
          // here we look for the presence of a '/' as in 'text/html' or 'application/json'
          if (dataColumnValue.includes('/')) {
            resolverResponse.mimeType = dataColumnValue;
          } else {
            const findMediaType = global_mediaTypes.find((mediaType) => mediaType.mediaTypeName === dataColumnValue.trim());
            if (findMediaType) {
              resolverResponse.mimeType = findMediaType.mimeType;
            }
          }
          break;

        case 'targetUrl':
          resolverResponse.targetUrl = dataColumnValue;
          break;

        case 'defaultLinktype':
          resolverResponse.defaultLinkType = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue.toUpperCase() === 'YES' || dataColumnValue === '1';
          break;

        case 'defaultIanaLanguage':
          resolverResponse.defaultIanaLanguage = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue.toUpperCase() === 'YES' || dataColumnValue === '1';
          break;

        case 'defaultContext':
          resolverResponse.defaultContext = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue.toUpperCase() === 'YES' || dataColumnValue === '1';
          break;

        case 'defaultMimeType':
          resolverResponse.defaultMimeType = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue.toUpperCase() === 'YES' || dataColumnValue === '1';
          break;

        case 'active':
          resolverResponse.active = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue.toUpperCase() === 'YES' || dataColumnValue === '1';
          break;

        case 'fwqs':
          resolverResponse.fwqs = dataColumnValue.toUpperCase() === 'Y' || dataColumnValue === '1';
          break;

        case 'itemDescription':
          // Note that descriptions can be built from several columns:
          resolverEntry.itemDescription += ` ${dataColumnValue}`;
          break;

        case 'linkTitle':
          resolverResponse.linkTitle = dataColumnValue;
          break;
      }
    }
  }

  // Finally trim any extraneous spaces from itemDescription (which can be built from several columns)
  resolverEntry.itemDescription = resolverEntry.itemDescription.trim();
};

const performResolverEntryCheck = async (resolverEntry, divCheckResults, counter, dataLine, dataOKFlag, resolverResponse) => {
  // Removes any empty cell designators
  while (dataLine.includes(global_EMPTYCELL_FLAG)) {
    dataLine = dataLine.replace(global_EMPTYCELL_FLAG, '');
  }

  // Just ensure that qualifierPath does not start with a '//' value:
  resolverEntry.qualifierPath = resolverEntry.qualifierPath.replace('//', '/');

  if (resolverEntry.identificationKeyType === '') {
    if (global_officialGS1Template) {
      resolverEntry.identificationKeyType = global_spreadSheetName.toLowerCase();
    } else {
      resolverEntry.identificationKeyType = document.getElementById('selectIdentificationKeyType').value.toLowerCase();
      if (resolverEntry.identificationKeyType === '') {
        divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: No GS1 Key Code column, and no default value set</div><p>${dataLine}</p><hr />`;
        dataOKFlag = false;
      }
    }
  }

  // call into Digital Link toolkit
  const gs1CheckResult = await runDigitalLinkCheck(resolverEntry.identificationKeyType, resolverEntry.identificationKey, resolverEntry.qualifierPath);
  if (gs1CheckResult.result === 'ERROR') {
    divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: ${resolverEntry.identificationKeyType}, ${resolverEntry.identificationKey}: ${gs1CheckResult.data}</div><p>${dataLine}</p><hr />`;
    dataOKFlag = false;
  }

  if (resolverResponse.targetUrl === '') {
    divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: No Target URL</div><p>${dataLine}</p><hr />`;
    dataOKFlag = false;
  } else if (!lineIncludesInternetURIScheme(resolverResponse.targetUrl)) {
    divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: Target URL -> ${resolverResponse.targetUrl} <- does not match web standards</div><p>${dataLine}</p><hr />`;
    dataOKFlag = false;
  }

  if (global_RegexAtLeast3AlphaNumerics.test(resolverEntry.itemDescription)) {
    divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: Item Description must have at at least 3 alphanumeric characters (a-z, A-Z, 0-9)</div><p>${dataLine}</p><hr />`;
    dataOKFlag = false;
  }

  // Fill in any 'blanks' from the web page selections
  if (resolverResponse.linkType === '') {
    // Set it to the value in selectDefaultLinkType control:
    resolverResponse.linkType = document.getElementById('selectDefaultLinkType').value;
    // Is it still blank?
    if (resolverResponse.linkType === '') {
      // Show an error:
      divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: Blank LinkType, and no default value set</div><p>${dataLine}</p><hr />`;
      dataOKFlag = false;
    } else {
      // Show 'default' info'
      divCheckResults.innerHTML += `<div style="color: blue;">Line ${counter}: Info: Blank LinkType set to default of '${resolverResponse.linkType}'</div><p>${dataLine}</p><hr />`;
    }
  } else {
    // Check that the linktype is 'allowed': To this, we check if it in the list stored.
    // We check if it is a URI or CURIE. If so, there is nothing more we need to do as resolverResponse.linkType is 'API ready'.
    // If isTitle instead (which we test lowercase/trimmed versions for max compatibility, we quietly convert the linkType to its CURIE value.
    // If not any of the three, it's an erro
    const isCURIE = global_linkTypes.find((linkType) => linkType.curie.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
    const isURI = global_linkTypes.find((linkType) => linkType.url.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());
    const isTitle = global_linkTypes.find((linkType) => linkType.title.toLowerCase().trim() === resolverResponse.linkType.toLowerCase().trim());

    if (!isCURIE && !isURI && !isTitle) {
      divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: LinkType '${resolverResponse.linkType}' is not in the official list of LinkTypes for this Resolver</div><p>${dataLine}</p>`;
      dataOKFlag = false;
    } else if (typeof isURI === 'object') {
      // set the linktype to its CURIE version
      resolverResponse.linkType = isURI.curie;
    } else if (typeof isTitle === 'object') {
      // set the linktype to its CURIE version
      resolverResponse.linkType = isTitle.curie;
    } else if (typeof isCURIE === 'object') {
      // set the linktype to its CURIE version
      resolverResponse.linkType = isCURIE.curie;
    } else {
      // It's unlikely we would end up here but we have code to deal with this as we are definitely in a data error.
      divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: LinkType ${resolverResponse.linkType} is not known</div><p>${dataLine}</p>`;
      dataOKFlag = false;
    }
  }
  if (resolverResponse.mimeType === '' || resolverResponse.mimeType === global_EMPTYCELL_FLAG) {
    resolverResponse.mimeType = document.getElementById('selectMIMEType').value;
    if (resolverResponse.mimeType === '') {
      divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: No MIME (document) column, and no default value set</div><p>${dataLine}</p><hr />`;
      dataOKFlag = false;
    }
  }

  if (resolverResponse.linkTitle === '') {
    resolverResponse.linkTitle = document.getElementById('defaultLinkText').value;
    if (resolverResponse.linkTitle === '') {
      divCheckResults.innerHTML += `<div style="color: red;">Line ${counter}: Error: Empty Link Text, and no default value set</div><p>${dataLine}</p><hr />`;
      dataOKFlag = false;
    }
  }
  return dataOKFlag;
};

/**
 * Checks the incoming data
 * @returns {Promise<void>}
 */
const checkData = async () => {
  let dataOKFlag = true;
  let dataLineCount = 0;
  let nonDataLineCount = 0;
  const divCheckResults = document.getElementById('divCheckResults');
  divCheckResults.innerHTML = '';

  // Display a spinning circle GIF
  divCheckResults.appendChild(imgRotatingCircleGIF('rotatingcircle_check'));

  // empty out the global array of entries:
  global_ResolverEntries = [];

  // First check all select controls have been set. If any values are 'X' it
  // means that some controls have not been set.
  if (!checkAllSelectControlsHaveBeenSet()) {
    divCheckResults.innerHTML = "You need to set all the column description dropdown boxes to a value (even if it is 'IGNORE') before continuing";
    window.alert("You need to set all the column description dropdown boxes to a value (even if it is 'IGNORE') before continuing");
    return;
  }
  let counter = 0;

  for (let dataLine of global_dataLines) {
    // Counter is incremented at the start of this loop since some code within the loop can
    // execute a 'continue' which jumps execution back up to here:
    counter += 1;

    // 'Sleep' for 0.1 seconds every 1000 rows to update the UI
    if (counter % 1000 === 0) {
      divCheckResults.innerHTML = `Checking...${counter} lines so far...`;
      await sleepForSeconds(0.1);
    }

    // if we have essentially an empty line, or one that starts with a comment # or // tag, or there
    // is not even one numeric digit (for example, it's a header line) then ignore this line and move on.
    // Regex /^([^0-9]*)$/g returns no match (null) if there is one or more digits in the string.
    // For us, one or more digits is a good thing because there has to be some (e.g. the GTIN) so if
    // dataLine.match(/^([^0-9]*)$/g) is not null then we have no numbers in our line.
    if (dataLine.trim().length < 20 || dataLine.startsWith('#') || dataLine.startsWith('//') || dataLine.match(/^([^0-9]*)$/g) !== null) {
      nonDataLineCount++;
      continue;
    } else {
      dataLineCount++;
    }

    // Create resolverEntry and resolverResponse objects ready to be populated:
    const resolverEntry = {
      identificationKeyType: '',
      identificationKey: '',
      itemDescription: '',
      qualifierPath: '/',
      active: true,
      responses: [],
    };

    const resolverResponse = {
      linkType: '',
      ianaLanguage: 'xx',
      context: 'xx',
      mimeType: '',
      linkTitle: '',
      targetUrl: '',
      fwqs: true,
      active: true,
      defaultLinkType: true,
      defaultIanaLanguage: true,
      defaultContext: true,
      defaultMimeType: true,
    };

    // First, check if the line has double double-quotes, replacing with single double-quotes, as in:
    // """grai"",""04012345111118"",""RTI Test"",""/"",""https://gs1.org/voc/pip"" ...
    //dataLine = dataLine.replace(/"",""/g, '","').replace(/"""/g, '"');

    // Split the line by "," - if that fails, just split on comma
    let dataColumns = dataLine.split('","');
    if (dataColumns.length < 3) {
      dataColumns = dataLine.split(',');
    }

    // loop through each column building the resolverEntry and resolverResponse:
    buildResolverEntry(dataColumns, resolverEntry, resolverResponse);

    // Now perform checks:
    dataOKFlag = await performResolverEntryCheck(resolverEntry, divCheckResults, counter, dataLine, dataOKFlag, resolverResponse);

    // if we have reached here, the line passed its checks and the data is added to the ready-to-upload
    // resolver entries list:
    if (dataOKFlag) {
      // Add the resolverResponse to the resolverEntry.responses[] array
      resolverEntry.responses.push(resolverResponse);

      // Add the resulting resolverEntry object to the global_ResolverEntries array.
      global_ResolverEntries.push(resolverEntry);
    }
  }
  if (document.getElementById('rotatingcircle_check')) {
    document.getElementById('rotatingcircle_check').style.visibility = 'hidden';
  }

  if (dataOKFlag) {
    // All is well - we are ready to upload!
    // First let's get null the original data object array as it could be many MB in size:
    global_dataLines = null;

    // Switch the display to show the Upload button
    document.getElementById('divPerformCheck').style.visibility = 'hidden';
    document.getElementById('divPerformUpload').style.visibility = 'visible';
    const divUploadResults = document.getElementById('divUploadResults');
    if (dataLineCount === 0) {
      divUploadResults.innerHTML = 'No data lines could be found! Please check your file, refresh this page and try again.';
      document.getElementById('buttonUploadNow').style.visibility = 'hidden';
      return;
    }
    divUploadResults.innerHTML = `All local checks were successful<br />${dataLineCount} recognised Resolver data lines `;

    if (nonDataLineCount > 0) {
      divUploadResults.innerHTML += `and ${nonDataLineCount} non-recognised (header or blank?) lines `;
    }
    divUploadResults.innerHTML += 'were counted.';

    if (document.getElementById('authKey').value.length === 0) {
      divUploadResults.innerHTML += "<br />Please paste your authentication key into the box at the top of this window then click 'Upload Data Now' button to upload.";
    } else {
      divUploadResults.innerHTML += "<br />Click 'Upload Data Now' button to upload.";
    }
  }
};

/**
 * Consults the Digital Link toolkit to see if the current entry is valis
 * @param identificationKeyType
 * @param identificationKey
 * @param qualifierPath
 * @returns {string|{}}
 */
const runDigitalLinkCheck = async (identificationKeyType, identificationKey, qualifierPath) => {
  let uriToTest = `/dltoolkit/analyseuri/${identificationKeyType}/${identificationKey}`;
  if (qualifierPath.startsWith('/')) {
    uriToTest += qualifierPath;
  } else {
    // Add a preceding forward-slash
    uriToTest += `/${qualifierPath}`;
  }
  console.log('Testing DL with:', uriToTest);
  try {
    const response = await fetch(uriToTest);
    return await response.json();
  } catch (err) {
    const errorObject = {};
    errorObject.result = 'ERROR';
    errorObject.error = `DigitalLink Toolkit tested -> ${uriToTest} <- and found this issue: '${err.toString()}'`;
    return errorObject;
  }
};

// This function takes each of the resolverEntry / resolverResponse entry pairs and groups them
// such that different resolverResponses for the same resolverEntry are joined together as
// resolverEntry.responses[] array.
const groupResolverEntries = async () => {
  const divUploadResults = document.getElementById('divUploadResults');
  const groupedResolverEntriesArray = [];
  let counter = 0;
  for (const resolverEntry of global_ResolverEntries) {
    counter++;
    // 'Sleep' for 1 second every 1000 rows to update the UI
    if (counter % 1000 === 0) {
      divUploadResults.innerHTML = `Creating upload format - ${counter} entries so far...`;
      await sleepForSeconds(0.1);
    }

    // Is the resolverEntry already in groupedResolverEntriesArray?
    // Find out using its unique combination of ID Key Type, ID key and qualifier path.
    // Note: If uploading many thousands of entries, this .some() search will get slower and
    //       slower as the array grows in size:
    if (
      !groupedResolverEntriesArray.some(
        (element) =>
          element.identificationKeyType === resolverEntry.identificationKeyType &&
          element.identificationKey === resolverEntry.identificationKey &&
          element.qualifierPath === resolverEntry.qualifierPath,
      )
    ) {
      // The resolver entry is NOT in the groupedResolverEntriesArray so push it all straight in:
      groupedResolverEntriesArray.push(resolverEntry);
    } else {
      // search for the entry in groupedResolverEntriesArray and update it.
      for (const i in groupedResolverEntriesArray) {
        if (
          groupedResolverEntriesArray[i].identificationKeyType === resolverEntry.identificationKeyType &&
          groupedResolverEntriesArray[i].identificationKey === resolverEntry.identificationKey &&
          groupedResolverEntriesArray[i].qualifierPath === resolverEntry.qualifierPath
        ) {
          // Only push the response section into the resolverEntry.response array:
          if (
            !groupedResolverEntriesArray[i].responses.some(
              (element) =>
                element.linkType === resolverEntry.responses[0].linkType &&
                element.ianaLanguage === resolverEntry.responses[0].ianaLanguage &&
                element.context === resolverEntry.responses[0].context &&
                element.mimeType === resolverEntry.responses[0].mimeType,
            )
          ) {
            groupedResolverEntriesArray[i].responses.push(resolverEntry.responses[0]);
            break;
          }
        }
      }
    }
  }
  // Now replace the global array with our new grouped array
  global_ResolverEntries = groupedResolverEntriesArray;
};

const imgRotatingCircleGIF = (imgControlId) => {
  const rotatingCircleGIF = document.createElement('img');
  rotatingCircleGIF.id = imgControlId;
  rotatingCircleGIF.src = 'images/rotatingcircle.gif';
  rotatingCircleGIF.width = '50';
  rotatingCircleGIF.height = '50';
  rotatingCircleGIF.alt =
    "Spinning circle indicating 'please wait!'. Attribution: Gray_circles.svg: Nevit Dilmen (talk)derivative work: Nevit Dilmen / CC BY-SA (https://creativecommons.org/licenses/by-sa/3.0)";
  return rotatingCircleGIF;
};

/**
 * Controls Upload the data prepared by the checking process, and also controls
 * waiting for all validation results still pending.
 * @returns {Promise<void>}
 */
const uploadDataAndAwaitResults = async () => {
  const divUploadResults = document.getElementById('divUploadResults');
  divUploadResults.innerHTML = '';

  const authKey = document.getElementById('authKey').value;
  if (authKey === '') {
    window.alert('Please paste in your authentication key to continue!');
    return; // This function is cancelled out here if there is no authentication key
  }

  // Hide the upload button and show the rotating circle
  document.getElementById('buttonUploadNow').style.visibility = 'hidden';
  divUploadResults.appendChild(imgRotatingCircleGIF('rotatingcircle_upload'));

  if (await uploadData(authKey)) {
    await pollForPendingResults(authKey);
    displayValidationErrors();
  } else {
    document.getElementById('buttonUploadNow').style.visibility = 'visible';
  }
  // Hide the rotating circle
  if (document.getElementById('rotatingcircle_upload')) {
    document.getElementById('rotatingcircle_upload').style.visibility = 'hidden';
  }
};

/**
 * Uploads resolver entry data to the API
 * @returns {Promise<boolean>}
 */
const uploadData = async (authKey) => {
  let batchUploadCounter = 1;
  let failCount = 0;
  let success = false;
  let entriesBatch = [];

  // We can feedback to the human what we're doing. They like that sort of thing:
  const divUploadResults = document.getElementById('divUploadResults');

  // Group the resolverEntries and their resolverResponses together such that each
  // resolverEntry has all its resolverResponses in resolverEntry.response[] array.
  await groupResolverEntries();

  // Let's get the uploading underway by batching the array of entries:
  for (let i = 0; i < global_ResolverEntries.length; i++) {
    entriesBatch.push(global_ResolverEntries[i]);

    // Upload the batch if the 'i' count equals the batch size, or we've reached
    // the final entry.
    if ((i % global_UploadBatchSize === 0 && i > 0) || i >= global_ResolverEntries.length - 1) {
      success = false;
      while (!success) {
        if (global_ResolverEntries.length <= global_UploadBatchSize) {
          // No need to talk about batches if there is only one batch!
          divUploadResults.innerText = `Uploading ${global_ResolverEntries.length} entries...`;
        } else {
          divUploadResults.innerText = `Uploading batch ${batchUploadCounter} (${Math.round(
            (batchUploadCounter * global_UploadBatchSize * 100) / global_ResolverEntries.length,
          )}%) of ${global_ResolverEntries.length} entries...`;
        }
        const results = await uploadToAPI(entriesBatch, authKey);
        if (results.STATUS === 200) {
          success = true;
          batchUploadCounter++;
          failCount = 0; // Success so reset the fail batchUploadCounter

          // Save the batchId and any immediately 'bad' entries returned in the API response body.
          // We'll fill in the validationResults[] later when we poll for pending processing updates@
          global_upload_batchIds.push({
            batchId: results.responseArray.batchId,
            batchStatusPending: true,
            badEntries: results.responseArray.badEntries,
            validationResults: [],
          });
        } else if (results.STATUS === 401) {
          divUploadResults.innerText = 'Your authentication key has been rejected!<br />Please paste the key sent to you by GS1 Global Office.';
          return false;
        } else {
          divUploadResults.innerText = `An error occurred uploading entries - trying again: ${failCount}`;
          failCount++; // upload attempt failed, adding 1 to the fail count
          await sleepForSeconds(1);
        }

        if (failCount > 10) {
          // too many failures - something is seriously wrong at the server end. Stopping the upload.
          divUploadResults.innerText = 'An error occurred uploading entries - too many failures - stopping upload';
          return false;
        }
      }

      // Empty the batchEntries array ready for filling up again!
      entriesBatch = [];
    }
  }
  divUploadResults.innerText = 'Upload completed';
  return success;
};

/**
 * Once all the data has been uploaded, this function is called to poll for pending results. It works by going
 * through the array of global_upload_batchIds and asking the Data Entry API for updated information.
 * This function finished when all the results are in.
 */
const pollForPendingResults = async (authKey) => {
  const divUploadResults = document.getElementById('divUploadResults');
  divUploadResults.innerText = 'Waiting for validation to complete...';

  let counter = 0;
  let finishFlag = false;
  while (!finishFlag) {
    // global_upload_batchIds array was set up by uploadData(), now we go through it
    // taking each batch and see if it is complete by asking the getBatchStatus() function:
    for (let i = 0; i < global_upload_batchIds.length; i++) {
      if (global_upload_batchIds[i].batchStatusPending) {
        const response = await getBatchStatus(global_upload_batchIds[i].batchId, authKey);
        if (response.SUCCESS && response.results.batchStatus === 1) {
          // This batch has completed validation data so save the resulting data[] array
          global_upload_batchIds[i].validationResults = response.results.data;

          // Set batchStatusPending to false. If all the batchStatusPending entries are false
          // we will come out of the loop shortly.
          global_upload_batchIds[i].batchStatusPending = false;
        }
      }
    }

    // See if there any entries with batchStatusPending set to true.
    // If not, .filter() returns an empty array
    const pendingBatchesArray = global_upload_batchIds.filter((entry) => entry.batchStatusPending);
    if (pendingBatchesArray.length === 0) {
      // Completed! Time to end the loop
      finishFlag = true;
      divUploadResults.innerText = 'Validation completed';
    } else {
      // Wait for 5 seconds then loop again
      counter++;
      divUploadResults.innerText = `Waiting for validation to complete... ${Math.round((pendingBatchesArray.length * 100) / global_upload_batchIds.length)}`;
      await sleepForSeconds(5);
    }
  }
};

/**
 * Displays any validation errors that were uncovered
 */
const displayValidationErrors = () => {
  /*
          batchId: results.responseArray['batchId'],
          batchStatusPending: true,
          badEntries: results.responseArray['badEntries'],
          validationResults: []
       */
  const divUploadResults = document.getElementById('divUploadResults');
  divUploadResults.innerText = '';

  for (const batchEntry of global_upload_batchIds) {
    // We will only display invalid entries:
    let validationErrorArray = batchEntry.validationResults.filter((entry) => entry.validationCode > 0);
    if (!validationErrorArray) {
      validationErrorArray = [];
    }
    if (batchEntry.badEntries.length + validationErrorArray.length === 0) {
      divUploadResults.innerHTML += `BatchId: ${batchEntry.batchId} published successfully<br />`;
    } else {
      divUploadResults.innerHTML += `BatchId: ${batchEntry.batchId} had ${batchEntry.badEntries.length + validationErrorArray.length} failed validations <br />`;
    }
    for (const badEntry of batchEntry.badEntries) {
      divUploadResults.innerHTML += `/${badEntry.identificationKeyType}/${badEntry.identificationKey} error code: ${convertValidationCodeToText(
        badEntry.validationCode,
      )} (${badEntry.validationCode})<br />`;
    }
    for (const badEntry of validationErrorArray) {
      divUploadResults.innerHTML += `/${badEntry.identificationKeyType}/${badEntry.identificationKey} error code: ${convertValidationCodeToText(
        badEntry.validationCode,
      )} (${badEntry.validationCode})<br />`;
    }
  }
  divUploadResults.innerHTML += '<br />All upload processing completed<hr /><a href="upload.html">Click here to refresh the page and upload more data</a>';
};

// Sleep function
const sleepForSeconds = async (seconds) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

/**
 *
 * @param resolverEntriesArray
 * @param authKey
 * @returns {Promise<{responseArray: [], STATUS: number}>}
 */
const uploadToAPI = async (resolverEntriesArray, authKey) => {
  const result = {
    STATUS: 0,
    responseArray: [],
  };

  try {
    const fetchParameters = {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(resolverEntriesArray),
    };

    // upload the resolverEntry
    const fetchResponse = await fetch('/resolver', fetchParameters);
    result.STATUS = fetchResponse.status;
    if (result.STATUS === 200) {
      result.responseArray = await fetchResponse.json();
    }

    return result;
  } catch (err) {
    console.log(`uploadToAPI error: ${err}`);
    return result;
  }
};

/**
 * Asks the API for the status of a given batch Id.
 * @param batchId
 * @param authKey
 * @returns {Promise<{SUCCESS: boolean, results: {}}>}
 */
const getBatchStatus = async (batchId, authKey) => {
  const result = { SUCCESS: false, results: {} };
  try {
    const fetchParameters = {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    };

    const fetchResponse = await fetch(`/resolver/validation/batch/${batchId}`, fetchParameters);
    if (fetchResponse.ok) {
      result.SUCCESS = true;
      result.results = await fetchResponse.json();
    }
    return result;
  } catch (err) {
    console.log(`getBatchStatus error: ${err}`);
  }
};
