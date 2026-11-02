# Document id helpers shared by all database backends.


# This function reformats the document id to be used in the database.
# Example: '/01/05392000229648' -> '01_05392000229648'. The leading '/' is removed
# and any other '/' characters are replaced with '_'. This is because some
# document database systems do not allow '/' characters in the primary identifier.
# This function survives keeping the correct format if called with a format that is already the internal format!
def reformat_id_for_db(document_id: str) -> str:
    document_id = document_id.replace('/', '_')
    if document_id[:1] == '_':
        document_id = document_id[1:]
    return document_id


# This function reverses the reformatting performed by reformat_id_for_db().
# Example: '01_05392000229648' -> '/01/05392000229648'. The leading '_' is replaced
# with a '/' and any other '_' characters are replaced with '/'. This is because
# we should be consistent with external views of id'.
# Note that, like function reformat_id_for_db(), this function survives keeping the
# correct format should it be called with the external format already!
def reformat_id_for_external_use(document_id: str) -> str:
    if document_id[0:1] == '/':
        return document_id.replace('_', '/')
    else:
        return '/' + document_id.replace('_', '/')
