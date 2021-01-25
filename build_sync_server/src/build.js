/* eslint-disable guard-for-in */
/**
 * build.js holds all the functionality required to run the BUILD application.
 * BUILD is controlled through the globally exposed .run() function below.
 */
// eslint-disable-next-line import/no-unresolved
const fetch = require('node-fetch');
const sqldb = require('./sqldb');
const mongodb = require('./mongodb');
const utils = require('./resolverUtils');
const linksetBuilder = require('./buildlinkset');

const rowBatchSize = process.env.SQLDB_PROCESS_BATCH_SIZE || 1000;

/**
 * getDigitalLinkVocabWord takes the linktype and creates a 'compressed' version (CURIE).
 * For example, 'https:/gs1.org/voc/hasRetailers' becomes 'gs1:hasRetailers', and
 *              alternative format 'gs1:hasRetailers' becomes 'gs1:hasRetailers'
 * Currently this function detects and supports 'gs1' and 'schema' CURIEs
 * @param linkTypeURL
 * @return string
 */
const getDigitalLinkVocabWord = (linkTypeURL) => {
  if (linkTypeURL.includes('/')) {
    const list = linkTypeURL.split('/');
    if (linkTypeURL.includes('gs1')) {
      return `gs1:${list[list.length - 1]}`;
    }
    if (linkTypeURL.includes('schema')) {
      return `schema:${list[list.length - 1]}`;
    }
    // Just return the original
    return list[list.length - 1];
  }

  if (linkTypeURL.includes('gs1:') || linkTypeURL.includes('schema:')) {
    // It's already a CURIE! Nice one :-)
    return linkTypeURL;
  }
  // We haven't much choice just to return what we were given - add a warning to console.
  utils.logThis(`getDigitalLinkVocabWord WARNING: unformatted CURIE linktype ${linkTypeURL} returned`);
  return linkTypeURL;
};

/**
 * getDigitalLinkStructure calls into the GS1 DigitalInk Toolkit library and
 * returns the object structure (if any) or an error. The qualifiers are sorted
 * into the correct order (if there are any).
 * @param uri
 * @returns {{result: string, error: string}}
 */
const getDigitalLinkStructure = async (uri) => {
  let structuredObject = { result: '', error: '' };
  try {
    const fetchURI = `http://digitallink-toolkit-service/analyseuri${uri}`;
    const fetchResponse = await fetch(fetchURI); // Note - NO / before the uri variable!
    const result = await fetchResponse.json();
    if (fetchResponse.status === 200) {
      structuredObject = result.data;
      structuredObject.result = 'OK';
    } else {
      console.log(`getDigitalLinkStructure error: ${result}`);
    }
    return structuredObject;
  } catch (err) {
    structuredObject.result = 'ERROR';
    structuredObject.error = err.toString();
    return structuredObject;
  }
};

/**
 * @param textThatIsSQLSafe
 * @return string
 * Purpose: Restores 'SQL Safe' text back to the original string from Base64
 *          if it is prefixed with the double-character '[]' symbol
 */
const decodeTextFromSQLSafe = (textThatIsSQLSafe) => {
  /* eslint-disable new-cap */
  let result = textThatIsSQLSafe;
  if (textThatIsSQLSafe.startsWith('[]')) {
    const buff = new Buffer.from(textThatIsSQLSafe.substring(2), 'base64');
    result = buff.toString('utf8');
  }
  if (result == null) {
    result = '';
  }
  return result;
};

/**
 * This function formats the URI document so that 'headers' such as "_id" and "unixtime" are placed at the top
 * and the variants (if more than one) are sorted alphanumerically, with the root variant "/" at the top.
 * This makes the JSON version of this document easier to read by 'mere' humans.
 * @param doc
 * @returns {{}}
 */
const formatUriDocument = (doc) => {
  const formattedDoc = {};
  formattedDoc._id = doc._id;
  formattedDoc.unixtime = doc.unixtime;

  if (doc['/'] !== undefined) {
    formattedDoc['/'] = doc['/'];
  }

  const sortedKeys = Object.keys(doc).sort();
  sortedKeys.forEach((entry) => {
    if (entry !== '_id' && entry !== 'unixtime' && entry !== '/') {
      formattedDoc[entry] = doc[entry];
    }
  });

  return formattedDoc;
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
    responses[index].default_linktype = defaultResponseList.some((dr) => dr.linktype === responses[index].linktype);
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
    const responseSet = await sqldb.getURIResponses(sqlDBEntryRow.uri_entry_id);

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
        const success = await mongodb.updateDocumentInMongoDB(mongoEntry, 'uri');
        if (!success) {
          utils.logThis(`Failed to update Mongo database with entry: ${JSON.stringify(mongoEntry)}`);
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
            await mongodb.deleteDocumentInMongoDB(mongoEntry, 'uri');
          } else {
            // There is still at least one qualifierPath left, so update the record which has had this qualifierPath removed.
            await mongodb.deleteDocumentInMongoDB(mongoEntry, 'uri');
          }
        }
      }
    } else {
      utils.logThis('updateUriDocument: A null response array was returned');
    }

    return mongoEntry;
  } catch (err) {
    utils.logThis(`updateUriDocument error: ${err}`);
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
      await mongodb.deleteDocumentInMongoDB(mongoEntry, 'uri');
    } else {
      // update
      await mongodb.updateDocumentInMongoDB(mongoEntry, 'uri');
    }
  }
};

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
    utils.logThis(`Processing batch of ${sqlDBEntrySet.length} entry entries`);
    for (const sqlDBEntryRow of sqlDBEntrySet) {
      processCounter += 1;
      if (processCounter % 100 === 0) {
        utils.logThis(`Processed count: ${processCounter} of ${sqlDBEntrySet.length} entries`);
      }

      if (processCounter === sqlDBEntrySet.length) {
        utils.logThis(`Processing completed: ${processCounter} of ${sqlDBEntrySet.length} entries`);
      }

      // Get the qualifier_path
      let qualifierPath = sqlDBEntryRow.qualifier_path.trim();
      if (qualifierPath === '' || qualifierPath.includes('undefined')) {
        // There are no variant attributes so we'll just define this entry as the 'root variant' denoted by '/':
        qualifierPath = '/';
      }

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
        const mongoEntry = await mongodb.findEntryInMongoDB(identificationKeyType, identificationKey, 'uri');

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
        utils.logThis(`Warning: Non DigitalLink-compliant resolver data entry record rejected: ${urlToTest} - error is: ${structure.error}`);
      }
    }
  } catch (err) {
    utils.logThis('buildURIDocuments error:', err);
  }
};

/**
 * Build the GCP Redirect entries for Resolver. If a full build is in progress,
 * the entry is updated, else a column 'update_or_delete_flag' that is part of each entry in
 * the gcpRedirectSet is examined as to whether it should update or delete the record
 * @param gcpRedirectSet
 * @param fullBuildIfTrue
 * @returns {Promise<void>}
 */
const buildGCPDocuments = async (gcpRedirectSet, fullBuildIfTrue) => {
  try {
    let processCounter = 0;
    utils.logThis(`Processing batch of ${gcpRedirectSet.length} GCP redirect entries`);
    for (const gcpRedirectEntry of gcpRedirectSet) {
      processCounter += 1;
      const identificationKeyType = gcpRedirectEntry.identification_key_type.trim();
      const prefixValue = gcpRedirectEntry.prefix_value.trim();
      const redirectURL = gcpRedirectEntry.target_url.trim();

      if (processCounter % 100 === 0) {
        utils.logThis(`Processed count: ${processCounter} of ${gcpRedirectSet.length}`);
      }

      await mongodb.findEntryInMongoDB(identificationKeyType, prefixValue, 'gcp');

      // The GCP document is far simpler than the URI document, with just an ID and URL.
      // So we will create the document here and insert/update it in the MongoDB database.
      const doc = {
        _id: `/${identificationKeyType}/${prefixValue}`,
        resolve_url_format: redirectURL,
      };

      if (fullBuildIfTrue) {
        await mongodb.updateDocumentInMongoDB(doc, 'gcp');
      } else {
        const updateOrDeleteFlag = gcpRedirectEntry.active;
        if (updateOrDeleteFlag) {
          await mongodb.updateDocumentInMongoDB(doc, 'gcp');
        } else {
          // Delete the GCP entry using its key:
          await mongodb.deleteDocumentInMongoDB({ _id: `/${identificationKeyType}/${prefixValue}` }, 'gcp');
        }
      }
    }
  } catch (err) {
    utils.logThis(`buildGCPDocuments error: ${err}`);
  }
};

/**
 * Performs a build based on all the changes that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */
const performSyncURIDocumentBuild = async (lastHeardDateTime, fullBuildFlag) => {
  if (fullBuildFlag) {
    await mongodb.createUnixTimeIndex();
  }

  let nextUriEntryId = 0;

  // This code will now loop until no more URI entries are returned from the database
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      // get the first / next set of URI entries. Entries are return by the database in
      // ascending uriEntryId order
      const entrySet = await sqldb.getURIEntries(lastHeardDateTime, nextUriEntryId, rowBatchSize);
      if (entrySet === null || entrySet.length === 0) {
        // No more entries so break out of the loop:
        break;
      } else {
        // We have one or more URI entries to Build:
        await buildURIDocuments(entrySet, fullBuildFlag);
        nextUriEntryId = parseInt(entrySet[entrySet.length - 1].uri_entry_id, 10) + 1;
      }
    } catch (err) {
      // It's all gone terribly wrong! Better make a note of the error and exit the loop
      utils.logThis(`performSyncURIDocumentBuild error: ${err}`);
      break;
    }
  }
};

/**
 * Performs a build based on entries for a specific GS1 Key Code and GS1 Key Value.
 * @param identificationKeyType
 * @param identificationKey
 * @returns {Promise<boolean>}
 */
const performIdKeyTypeAndValueURIDocumentBuild = async (identificationKeyType, identificationKey) => {
  utils.logThis(`Performing a URI Update Build of the database using GS1 Key Code: ${identificationKeyType} and GS1 Key Value: ${identificationKey}`);
  let success = true;
  try {
    const entrySet = await sqldb.getURIEntriesUsingIdentificationKeyValue(identificationKeyType, identificationKey);
    if (entrySet === null || entrySet.length === 0) {
      utils.logThis(`No identificationKeyType: ${identificationKeyType} and identificationKey: ${identificationKey} exists in SQL DB!`);
      success = false;
    } else {
      await buildURIDocuments(entrySet, true);
    }
  } catch (err) {
    utils.logThis(`performIdKeyTypeAndValueURIDocumentBuild error: ${err}`);
    success = false;
  }

  return success;
};

/**
 * Performs a build based on all the changes to GCP records that have happened since this server last registered with the database.
 * @returns {Promise<void>}
 * @param lastHeardDateTime
 * @param fullBuildFlag
 */
const performSyncGCPDocumentBuild = async (lastHeardDateTime, fullBuildFlag) => {
  /* eslint-disable no-constant-condition */
  let nextGCPRedirectId = 0;
  while (true) {
    try {
      const gcpSet = await sqldb.getGCPRedirects(lastHeardDateTime, nextGCPRedirectId, rowBatchSize);
      if (gcpSet === null || gcpSet.length === 0) {
        break;
      } else {
        await buildGCPDocuments(gcpSet, fullBuildFlag);
        nextGCPRedirectId = gcpSet[gcpSet.length - 1].gcp_redirect_id + 1;
      }
    } catch (err) {
      utils.logThis(`performSyncGCPDocumentBuild error: ${err}`);
      break;
    }
  }
};

/**
 * Each synchronisation process needs calling build sync servers to register with the SQL data entry database
 * using a unique id. This 12 character ID is originally sourced from the build-sync-server's given HOSTNAME
 * from an environment variable offered to it by the hosting Docker-compatible engine.
 * This value is stored in the local MongoDB database, and subsequently retrieved when build-sync-server
 * starts up. After then, build-sync-server uses the value in the database rather than its own HOSTNAME
 * so that the data sync is consistent with the MongoDB database's data store.
 * It also make it easy to force a rebuild by deleting the registered entry in the SQL database.
 * In response, the object returned has three properties:
 *    .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
 *    .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
 *    .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
 * @returns {Promise<{lastHeardDateTime}>}
 */
const registerThisSyncServer = async () => {
  let lastHeardDateTime = '';

  try {
    await mongodb.getResolverDatabaseIdFromMongoDB();

    // Register this server with the data-entry database
    const result = await sqldb.registerSyncServer(global.syncId, process.env.HOSTNAME);

    if (result === null) {
      utils.logThis('registerThisSyncServer warning: Could not get last heard datetime from SQL database!');
    } else {
      // Process metrics that have come back from a successful registration so that the calling function
      // can find out what synchronisation work (if any) it needs to do.
      lastHeardDateTime = result[0].last_heard_datetime;
    }
  } catch (error) {
    utils.logThis(`registerThisSyncServer error: ${error}`);
  }
  return lastHeardDateTime;
};

/**
 * The run function controls the BUILD process.
 * @returns {Promise<void>}
 */
const run = async () => {
  global.buildRunningFlag = true;

  // Register this server's hostname with the SQL Database.
  // In response, the object returned has three properties:
  //     .updateCount - which lists the number of sync updates required, or -1 if a full sync is needed.
  //     .lastHeardUnixTime - which contains the unixtime (secs since 01-01-1970) when this hostname was last heard (or NULL if never heard before)
  //     .nextResolverSyncChangeId - the id of the next sync queue entry that will be used by a 'changes-only' sync
  const lastHeardDateTimeObj = await registerThisSyncServer();

  // Convert date/time object to a string representing the date:
  const lastHeardDateTime = JSON.stringify(lastHeardDateTimeObj).replace(/"/g, '');

  // If this server has not been heard from before, lastHeardDataTime will be 1st January 2020.
  const fullBuildFlag = String(lastHeardDateTime).includes('2020-01-01');
  if (fullBuildFlag) {
    utils.logThis(`This build sync server '${global.syncId}' has not been heard from before, so a full build of the MongoDB will now commence`);
    await mongodb.dropCollection('gcp');
    await mongodb.dropCollection('uri');
  } else {
    utils.logThis(`Build: '${global.syncId}' last heard ${lastHeardDateTime} - running 'update' build`);
  }

  // build GCPs before URIs as there are far fewer entries to build with GCP.
  await performSyncGCPDocumentBuild(lastHeardDateTime, fullBuildFlag);
  await performSyncURIDocumentBuild(lastHeardDateTime, fullBuildFlag);

  sqldb.closeDB().then();
  mongodb.closeDB().then();
  global.buildRunningFlag = false;
};

module.exports = {
  run,
  performIdKeyTypeAndValueURIDocumentBuild,
};
