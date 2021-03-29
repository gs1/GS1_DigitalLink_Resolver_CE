/* eslint-disable guard-for-in */
/* eslint-disable radix */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
/* eslint-disable no-cond-assign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/*
  A set of functions for interpreting the string of data in various GS1 formats, as found in barcodes of different types
  It depends on the GS1 Digital Link toolkit
  If there are no errors, the interpretScan function returns an object as follows

  AIbrackets: The equivalent GS1 element string in human-readable AI syntax
  AIfnc1: The equivalent GS1 element string in AI syntax with FNC1 (as used in barcodes)
  dl: The equivalent GS1 Digital Link URL (on id.gs1.org)
  ol: An ordered array of objects parsed/interpreted from the input string:
    ai:    the GS1 Application Identifier
    label: what that AI is used for
    value: the value

  The order for the ol list matches that found in a GS1 Digital Link URI
    - primary identifier
    - any applicable qualifiers
    - any data attributes
    - any non-GS1 AIs and their values

  Simply pass the string to be interpreted to the interpretScan() function.

  It can handle any of the 3 formats:
    - Human readable AI syntax
    - Pure AI syntax
    - GS1 Digital Link

  If the input string cannot be interpreted, i.e. it's not a valid GS1 string, then the returned object
  has a value for errmsg which is the system error message.

*/

/* This first mini function tests the incoming string against the monster regular expression that assesses whether the incoming string is plausibly a GS1 DL URI
It DOES NOT guarantee that a true response *is* is GS1 DL URI, but will reject a lot that it knows to be false.
This RegEx is included in version 1.2 of Digital Link: URI Syntax. All improvements welcome.

The initial pattern matches the structure of a URL (http or https) including the little-used but possible inclusion of passwords and port numbers.

^https?:(\/\/((([^\/?#]*)@)?([^\/?#:]*)(:([^\/?#]*))?))?

Next we want to test for the presence of a path component containing a primary key (which may follow aribitrary other path segments). This can be either in its numeric form or its convenience string equivalent. We further want to test that the path segment following the primary key:

•	Is a string beginning with at least 4 digits.
•	Is followed optionally zero or more repetitions of:
  o	a literal forward slash;
  o	one or more characters of which none are a literal forward slash;
  o	another literal forward slash;
  o	one or more characters of which none are a literal forward slash.

Furthermore:

•	A trailing forward slash is allowed at the end of the URI path info (strictly speaking forbidden by the ABNF grammar for DL but is tolerable)
•	Anything following the path is within the structure of a URL with a query string and fragment identifier.

These rules are expressed in the following pattern

([^?#]*)(\/(01|gtin|8006|itip|8013|gmn|8010|cpid|414|gln|417|party|8017|gsrnp|8018|gsrn|255|gcn|00|sscc|253|gdti|401|ginc|402|gsin|8003|grai|8004|giai)\/)(\d{4}[^\/]+)(\/[^/]+\/[^/]+)?[/]?(\?([^?\n]*))?(#([^\n]*))?

A final complexity is that a GS1 DL URI may be compressed [DL-Compression]. The path of a compressed GS1 DL URI will:

•	Contain at least 10 characters from the base 64 safe set (digits, upper and lower case Latin letters, _ -)
•	No other characters (including path separators, querystrings and fragments)

These features are tested by

\/[0-9A-Za-z_-]{10,}$

Therefore, the path of a GS1 DL URI will match either of the previous two patterns.

Concatenating these gives the full RegEx.
*/

const plausibleGs1DlUriRegEx = /^https?:(\/\/((([^\/?#]*)@)?([^\/?#:]*)(:([^\/?#]*))?))?((([^?#]*)(\/(01|gtin|8006|itip|8013|gmn|8010|cpid|414|gln|417|party|8017|gsrnp|8018|gsrn|255|gcn|00|sscc|253|gdti|401|ginc|402|gsin|8003|grai|8004|giai)\/)(\d{4}[^\/]+)(\/[^/]+\/[^/]+)?[/]?(\?([^?\n]*))?(#([^\n]*))?)|(\/[0-9A-Za-z_-]{10,}$))/;

const plausibleCompressedGs1DlUriRegEx = /^https?:(\/\/((([^\/?#]*)@)?([^\/?#:]*)(:([^\/?#]*))?))?\/[0-9A-Za-z_-]{10,}$/;

function isPlausibleGs1DlUri(s) {
  return plausibleGs1DlUriRegEx.test(s);
}

function interpretScan(scan) {
  const gtinRE = /^(\d{8})$|^(\d{12,14})$/;
  let e;
  let gs1DigitalLinkURI;
  let gs1ElementStrings;
  let gs1Array;
  let primaryKey;
  let AIstringBrackets;
  let AIstringFNC1;
  let errmsg;
  let gs1dlt;
  const dlOrderedAIlist = [];
  const dateAIs = ['11', '12', '13', '15', '17'];

  if ((e = scan.match(gtinRE))) {
    // So we just have a GTIN (from an EAN/UPC probably)
    scan = `(01)${scan}`;
  } else if (scan.indexOf(String.fromCharCode(29)) == 0) {
    scan = scan.substring(1);
    console.log(`We have this ${scan}`);
  }
  try {
    gs1dlt = new GS1DigitalLinkToolkit();
    if (isPlausibleGs1DlUri(scan)) {
      if (plausibleCompressedGs1DlUriRegEx.test(scan)) {
        scan = gs1dlt.decompressGS1DigitalLink(scan, false, 'https://id.gs1.org'); // Decompress if it's likely to be compressed
      }
      try {
        gs1ElementStrings = gs1dlt.gs1digitalLinkToGS1elementStrings(scan, true);
        gs1DigitalLinkURI = scan;
      } catch (err) {
        console.log(err);
        errmsg = err;
      }
    } else {
      try {
        gs1DigitalLinkURI = gs1dlt.gs1ElementStringsToGS1DigitalLink(scan, false, 'https://id.gs1.org');
      } catch (err) {
        console.log(err);
        errmsg = err;
      }
    }
    //    console.log('We have a DL of ' + gs1DigitalLinkURI);
  } catch (err) {
    console.log(err);
    errmsg = err;
  }

  // Whatever the input, we have a DL or an error. If an error, the value of gs1DigitalLinkURI is undefined
  if (gs1DigitalLinkURI == undefined) {
    return { errmsg };
  }
  try {
    gs1Array = gs1dlt.extractFromGS1digitalLink(gs1DigitalLinkURI);
  } catch (err) {
    console.log(err);
    return { errmsg: err }; // Quit here if we have an error
  }

  // Want to find the primary identifier
  // We'll use the aitable
  const done = []; // Use this to keep track of what we've done
  for (i in gs1Array.GS1) {
    if (gs1dlt.aitable.find((x) => x.ai === i).type === 'I') {
      primaryKey = i;
      console.log(`Primary key is ${primaryKey}`);
      dlOrderedAIlist.push(getAIElement(i, gs1dlt, gs1Array.GS1, dateAIs));
      done.push(i);
    }
  }
  if (gs1dlt.aiQualifiers[primaryKey] !== undefined) {
    gs1dlt.aiQualifiers[primaryKey].forEach((i) => {
      if (gs1Array.GS1[i] !== undefined) {
        dlOrderedAIlist.push(getAIElement(i, gs1dlt, gs1Array.GS1, dateAIs));
        done.push(i);
      }
    });
  }
  // console.log(dlOrderedAIlist); // These are the ones we have already got. We need to get the rest but these can be in any order
  for (i in gs1Array.GS1) {
    if (!done.includes(i)) {
      dlOrderedAIlist.push(getAIElement(i, gs1dlt, gs1Array.GS1, dateAIs));
      done.push(i);
    }
  }
  for (i in gs1Array.other) {
    // These are the non-GS1 elements that can occur in a DL URI. We don't know the labels
    if (!dlOrderedAIlist.includes(i)) {
      const temp = {};
      temp.ai = i;
      temp.value = gs1Array.other[i];
      dlOrderedAIlist.push(temp);
      done.push(i);
    }
  }
  const returnObject = sortElementString(gs1Array.GS1);
  returnObject.ol = dlOrderedAIlist;
  returnObject.dl = gs1DigitalLinkURI;
  console.log(returnObject);
  return returnObject;
}

function getAIElement(e, gs1dlt, values, dateAIs) {
  ro = {};
  ro.ai = e;
  ro.label = gs1dlt.aitable.find((x) => x.ai === e).label;
  ro.value = dateAIs.includes(e) ? gs1ToISO(values[e]) : values[e];
  return ro;
}

function sortElementString(a) {
  // This creates two GS1 element string versions of the given array, one with brackets, one with FNC1
  // Order is:
  // Primary key
  // Fixed length
  // The rest

  const gs1dlt = new GS1DigitalLinkToolkit();
  let sortedBrackets = '';
  let sortedFNC1 = '';
  //  const FNC1 = String.fromCharCode(29);
  const FNC1 = gs1dlt.groupSeparator;
  for (i in a) {
    // Look for the primary key
    if (gs1dlt.aitable.find((x) => x.ai == i).type == 'I') {
      sortedBrackets = `(${i})${a[i]}`;
      sortedFNC1 = FNC1 + i + a[i];
    }
  }
  for (i in a) {
    // Look for fixed length AIs
    if (sortedBrackets.indexOf(`(${i})`) == -1 && gs1dlt.aitable.find((x) => x.ai == i).fixedLength == true) {
      sortedBrackets += `(${i})${a[i]}`;
      sortedFNC1 += i + a[i];
    }
  }
  for (i in a) {
    // Everything else
    if (sortedBrackets.indexOf(`(${i})`) == -1) {
      sortedBrackets += `(${i})${a[i]}`;
      sortedFNC1 += i + a[i] + FNC1;
    }
  }
  if (sortedFNC1.lastIndexOf(FNC1) == sortedFNC1.length - 1) {
    sortedFNC1 = sortedFNC1.substring(0, sortedFNC1.length - 1);
  }
  console.log(sortedBrackets);
  console.log(sortedFNC1);
  return { AIbrackets: sortedBrackets, AIfnc1: sortedFNC1 };
}
function gs1ToISO(gs1Date) {
  let rv = '';
  const regexDate = new RegExp('^\\d{6}$');
  if (gs1Date !== undefined && regexDate.test(gs1Date)) {
    const doubleDigits = gs1Date.split(/(\d{2})/);
    const year = parseInt(doubleDigits[1]);
    const currentYear = new Date().getFullYear().toString();
    const currentLastYY = parseInt(currentYear.substr(-2));
    const currentFirstYY = parseInt(currentYear.substr(0, 2));
    const diff = year - currentLastYY;
    let fullyear = currentFirstYY.toString() + year.toString();
    if (diff >= 51 && diff <= 99) {
      fullyear = (currentFirstYY - 1).toString() + year.toString();
    }
    if (diff >= -99 && diff <= -50) {
      fullyear = (currentFirstYY + 1).toString() + year.toString();
    }
    if (fullyear !== undefined) {
      rv = `${fullyear}-${doubleDigits[3]}`;
      if (doubleDigits[5] != '00') {
        rv += `-${doubleDigits[5]}`;
      }
    }
  }
  return rv;
}

function displayInterpretation(scan, outputNode) {
  const scanObj = interpretScan(scan);
  outputNode.innerHTML = '';

  // We can test whether we have any errors at this point by looking for a value of errmsg

  if (scanObj.errmsg !== undefined) {
    console.log(`From GS1 Digital Link toolkit: ${scanObj.errmsg}`);
    const p = document.createElement('p');
    p.classList.add('error');
    p.appendChild(document.createTextNode(scanObj.errmsg));
    outputNode.appendChild(p);
  } else {
    let label = document.createElement('label');
    label.classList.add('sectionHeader');
    label.htmlFor = 'identifiers';
    label.appendChild(document.createTextNode('GS1 identifiers'));
    outputNode.appendChild(label);
    let div = document.createElement('div');
    div.id = 'identifiers';
    for (i in scanObj.ol) {
      // scanObj.ol is the ordered list we want to go through
      const p = document.createElement('p');
      p.id = `_${scanObj.ol[i].ai}`;
      p.classList.add('aiDisplay');
      let span = document.createElement('span');
      span.classList.add('ai');
      const ai = scanObj.ol[i].ai == undefined ? '' : scanObj.ol[i].ai;
      span.appendChild(document.createTextNode(ai));
      p.appendChild(span);
      span = document.createElement('span');
      span.classList.add('aiLabel');
      label = scanObj.ol[i].label == undefined ? '' : scanObj.ol[i].label;
      span.appendChild(document.createTextNode(label));
      p.appendChild(span);
      span = document.createElement('span');
      p.appendChild(span);
      span = document.createElement('span');
      span.classList.add('aiValue');
      const v = scanObj.ol[i].value == undefined ? '' : scanObj.ol[i].value;
      span.appendChild(document.createTextNode(v));
      p.appendChild(span);
      div.appendChild(p);
    }
    outputNode.appendChild(div);

    // Now we want to show the different formats of the scanned string.

    label = document.createElement('label');
    label.htmlFor = 'syntaxes';
    label.classList.add('sectionHeader');
    label.appendChild(document.createTextNode('Equivalent identifiers'));
    outputNode.appendChild(label);
    div = document.createElement('div');
    div.id = 'syntaxes';
    let p = document.createElement('p');
    label = document.createElement('label');
    label.htmlFor = 'aiBrackets';
    label.appendChild(document.createTextNode('Human-readable AI syntax'));
    let span = document.createElement('span');
    span.classList.add('syntax');
    span.id = 'aiBrackets';
    span.appendChild(document.createTextNode(scanObj.AIbrackets));
    p.appendChild(label);
    p.appendChild(span);
    div.appendChild(p);

    p = document.createElement('p');
    label = document.createElement('label');
    label.htmlFor = 'aiFNC1';
    label.appendChild(document.createTextNode('Native AI syntax'));
    span = document.createElement('span');
    span.classList.add('syntax');
    span.id = 'aiFNC1';
    span.appendChild(document.createTextNode(scanObj.AIfnc1));
    p.appendChild(label);
    p.appendChild(span);
    div.appendChild(p);

    p = document.createElement('p');
    label = document.createElement('label');
    label.htmlFor = 'dl';
    label.appendChild(document.createTextNode('GS1 Digital Link URI'));
    span = document.createElement('span');
    span.classList.add('syntax');
    span.id = 'dl';
    const a = document.createElement('a');
    a.href = scanObj.dl;
    a.appendChild(document.createTextNode(scanObj.dl));
    span.appendChild(a);
    p.appendChild(label);
    p.appendChild(span);
    div.appendChild(p);

    outputNode.appendChild(div);
  }
}
