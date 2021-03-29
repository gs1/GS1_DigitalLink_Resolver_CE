const { logThis, getDigitalLinkStructure, getDigitalLinkVocabWord, decodeTextFromSQLSafe } = require('../resolverUtils');
const { findEntryInMongoDB, deleteDocumentInMongoDB, updateDocumentInMongoDB } = require('../db/mongo-controller/resolverDocumentOps');
const { getURIResponsesSQLData } = require('../db/mssql-controller/uriTableOps');
const { decodeSQLSafeResolverArray, formatUriDocument } = require('./controllerUtils');
const linksetBuilder = require('../buildlinkset');

/**
 * buildURIDocuments takes a sqlDBEntrySet of entry rows and processes them into MongoDB by building each document.
 * If fullBuildIfTrue = true, this function will always process this entry as an update. If false, the added column
 * 'update_or_delete_flag' is examined (it is part of the entry record).
 * @param sqlDBEntrySet
 * @param fullBuildIfTrue
 * @returns {Promise<{db_attributeId: *, entryEntry: *}>}
 */
const buildURIDocuments = async (sqlDBEntrySet, fullBuildIfTrue) => {
  try {
    let processCounter = 0;
    logThis(`Processing batch of ${sqlDBEntrySet.length} entry entries`);
    for (const sqlDBEntryRow of sqlDBEntrySet) {
      processCounter += 1;
      if (processCounter % 100 === 0) {
        logThis(`Processed count: ${processCounter} of ${sqlDBEntrySet.length} entries`);
      }

      if (processCounter === sqlDBEntrySet.length) {
        logThis(`Processing completed: ${processCounter} of ${sqlDBEntrySet.length} entries`);
      }

      // Get the qualifier_path
      // There are no variant attributes so we'll just define this entry as the 'root variant' denoted by '/':
      let qualifierPath = sqlDBEntryRow.qualifier_path.trim() || '/';
      // qualifierPath = qualifierPath.replace(/{/g, "%7B").replace(/}/g, "%7B");
      qualifierPath = encodeURI(qualifierPath);
      // test that the entry is DigitalLink compliant
      const urlToTest = `/${sqlDBEntryRow.identification_key_type.trim()}/${sqlDBEntryRow.identification_key.trim()}${qualifierPath}`;
      const structure = await getDigitalLinkStructure(urlToTest);
      if (structure.result === 'OK') {
        // These are the identificationKeyTypes and values as the official GS1 Digital Link Toolkit understands them,
        // which is the same toolkit also used by id_web_server to gain that same understanding.
        // by having both servers rely on the toolkit, we get consistency of data (e.g. '01' and not 'gtin').
        const identificationKeyType = Object.keys(structure.identifiers[0])[0];
        const identificationKey = structure.identifiers[0][identificationKeyType];

        // qualifierPath is now rebuilt according to the values in structure.qualifiers, and we build
        // in the order of .sortedQualifiers[] if it exists:
        qualifierPath = '';
        const sortedQualifiers = structure.sortedQualifiers ? structure.sortedQualifiers : structure.qualifiers;

        for (const qualifier of sortedQualifiers) {
          const qualifierKey = Object.keys(qualifier);
          const qualifierValue = qualifier[qualifierKey];
          qualifierPath += `/${qualifierKey}/${qualifierValue}`;
        }

        if (qualifierPath === '') {
          qualifierPath = '/';
        }

        // Go and get the existing entry document from the MongoDB database
        const mongoEntry = await findEntryInMongoDB(identificationKeyType, identificationKey, 'uri');

        if (fullBuildIfTrue) {
          await updateUriDocument(sqlDBEntryRow, qualifierPath, mongoEntry, identificationKeyType, identificationKey, sortedQualifiers, structure);
        } else {
          const updateOrDeleteFlag = sqlDBEntryRow.active;
          if (updateOrDeleteFlag) {
            await updateUriDocument(sqlDBEntryRow, qualifierPath, mongoEntry, identificationKeyType, identificationKey, sortedQualifiers, structure);
          } else {
            await deleteUriDocument(mongoEntry, qualifierPath);
          }
        }
      } else {
        logThis(`Warning: Non DigitalLink-compliant resolver data entry record rejected: ${urlToTest} - error is: ${structure.error}`);
      }
    }
  } catch (err) {
    logThis('buildURIDocuments error:', err);
  }
};

/**
 * Updates the resolver URI document with the included qualifier path entry, inserting it if
 * does not exist already.
 * @param sqlDBEntryRow
 * @param qualifierPath
 * @param mongoEntry
 * @param identKeyType
 * @param identKey
 * @param sortedQualifiers
 * @returns {Promise<*>}
 */
const updateUriDocument = async (sqlDBEntryRow, qualifierPath, mongoEntry, identKeyType, identKey, sortedQualifiers, structure) => {
  try {
    // First get the responses for this uri_entry_id
    let responseSet = await getURIResponsesSQLData(sqlDBEntryRow.uri_entry_id);
    responseSet = decodeSQLSafeResolverArray(responseSet);

    if (responseSet !== null) {
      // Fix any 'default' flag issues (see comments at function):
      fixDefaultLinkTypeFlags(responseSet);

      // This is an update so we will go ahead and build the record.
      // Build a qualifier path entry record for this entry and its responses.
      const qualifierPathEntry = buildQualifierPathEntry(qualifierPath, sqlDBEntryRow, responseSet);

      if (qualifierPathEntry !== null) {
        if (mongoEntry === null) {
          // Create a brand new document
          mongoEntry = {
            _id: `/${identKeyType}/${identKey}`,
            // qualifierPaths: [ qualifierPathEntry ]
            [qualifierPath]: qualifierPathEntry,
          };
        } else {
          mongoEntry[qualifierPath] = qualifierPathEntry;
        }

        // If the qualifierPath includes template variables signified by {variablename} format
        // Populate a variables[] array with the variable names. Later, Resolver's web server
        // will look for variables array having variables, and replace them with actual values
        // being resolved (see function getQualifierPathDoc() in reseolver_web_server code).
        if (qualifierPath.includes('{')) {
          mongoEntry[qualifierPath].variables = sortedQualifiers;
        }

        // update unixtime to this current second:
        mongoEntry.unixtime = Math.round(new Date().getTime() / 1000);

        // format the document for best efficient parsing by the resolving application:
        mongoEntry = formatUriDocument(mongoEntry);

        // Add the linkset info:
        mongoEntry[qualifierPath].linkset = linksetBuilder.getLinkSetJson(mongoEntry[qualifierPath], identKeyType, identKey, qualifierPath, mongoEntry.unixtime);
        mongoEntry[qualifierPath].linkHeaderText = linksetBuilder.getLinkHeaderText(mongoEntry[qualifierPath], structure);

        // update in document in the Mongo database
        const success = await updateDocumentInMongoDB(mongoEntry, 'uri');
        if (!success) {
          logThis(`Failed to update Mongo database with entry: ${JSON.stringify(mongoEntry)}`);
        }
      } else {
        // A entry with no responses has been found in the database, so this safety feature kicks in
        // to remove the qualifierPath from the record (or the entire record) in MongoDB (if mongoEntry isn't
        // null, which would be the case if no record exists in MongoDB anyway).
        /* eslint-disable no-lonely-if */
        if (mongoEntry !== null) {
          if (mongoEntry[qualifierPath] !== null) {
            delete mongoEntry[qualifierPath];
          }
          if (Object.keys(mongoEntry).length < 3) {
            // Now we've removed that qualifierPath, there are no qualifierPaths left! Delete the record.
            await deleteDocumentInMongoDB(mongoEntry, 'uri');
          } else {
            // There is still at least one qualifierPath left, so update the record which has had this qualifierPath removed.
            await deleteDocumentInMongoDB(mongoEntry, 'uri');
          }
        }
      }
    } else {
      logThis('updateUriDocument: A null response array was returned');
    }

    return mongoEntry;
  } catch (err) {
    logThis(`updateUriDocument error: ${err}`);
    return null;
  }
};

/**
 * Deletes the URI variant entry from the resolver document for this gs1 keyy acode and value.
 * If there are no URI entries left, deletes the whole document
 * @param mongoEntry
 * @param qualifierPath
 * @returns {Promise<void>}
 */
const deleteUriDocument = async (mongoEntry, qualifierPath) => {
  // DELETE entry entry
  // We need to remove this entry from the list in the MongoDB record
  if (mongoEntry !== null) {
    // Remove from the document
    delete mongoEntry[qualifierPath];

    // Let's see if that there are any more variants left after deleting that variant.
    // if not then delete the entire document, otherwise update it.
    if (Object.keys(mongoEntry).length < 3) {
      // delete
      await deleteDocumentInMongoDB(mongoEntry, 'uri');
    } else {
      // update
      await updateDocumentInMongoDB(mongoEntry, 'uri');
    }
  }
};

/**
 * Some mere humans have their responses set such that for the same linktype, some entries have default_linktype
 * set to true and some set to false. This function fixes that by finding linktypes with default_linktype set True
 * and changes all entries with that linktype's default_linktype to true even if it was false before.
 * @param responses
 */
const fixDefaultLinkTypeFlags = (responses) => {
  // create a new array of responses where default_linktype is true.
  const defaultResponseList = responses.filter((response) => response.default_linktype);
  for (const index in responses) {
    if ({}.hasOwnProperty.call(responses, index)) {
      responses[index].default_linktype = defaultResponseList.some((dr) => dr.linktype === responses[index].linktype);
    }
  }
};

/**
 * buildQualifierPathEntry creates a qualifierPaths[] entry that will be inserted into the qualifierPaths[] array
 * for the current document being built by the function that calls this one.
 * @param qualifierPath
 * @param sqlDBEntry
 * @param responses
 * @returns {{}}
 */
const buildQualifierPathEntry = (qualifierPath, sqlDBEntry, responses) => {
  const qualifierPathEntry = {
    // qualifierPath: qualifierPath,
    active: sqlDBEntry.active,
    itemDescription: sqlDBEntry.item_description,
    responses: [],
  };

  if (responses.length === 0) {
    // No responses! Ditch this qualifierPathEntry by returning null
    return null;
  }

  responses.forEach((response) => {
    const _link = response.target_url;
    const _title = decodeTextFromSQLSafe(response.link_title);
    const _linkType = getDigitalLinkVocabWord(response.linktype);

    const _ianaLanguage = response.iana_language;
    const _context = response.context;
    const _mimeType = response.mime_type;
    const _active = response.active;
    const _fwqs = response.forward_request_querystrings;

    const _defaultLinkType = response.default_linktype;
    const _defaultIanaLanguage = response.default_iana_language;
    const _defaultContext = response.default_context;
    const _defaultMimeType = response.default_mime_type;

    // Create the list of responses
    const _responseObj = {
      link: _link,
      title: _title,
      linkType: _linkType,
      ianaLanguage: _ianaLanguage,
      context: _context,
      mimeType: _mimeType,
      active: _active,
      fwqs: _fwqs,
      defaultLinkType: _defaultLinkType,
      defaultIanaLanguage: _defaultIanaLanguage,
      defaultContext: _defaultContext,
      defaultMimeType: _defaultMimeType,
    };
    qualifierPathEntry.responses.push(_responseObj);
  });

  return qualifierPathEntry;
};
module.exports = buildURIDocuments;
