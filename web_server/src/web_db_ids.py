# Document id helper shared by all database backends.


# Example: '/01/05392000229648' -> '01_05392000229648'. The leading '/' is removed
# and any other '/' characters are replaced with '_'. This matches the document ids
# stored by the data entry server.
def reformat_id_for_db(anchor_id: str) -> str:
    anchor_id = anchor_id.replace('/', '_')
    if anchor_id[:1] == '_':
        anchor_id = anchor_id[1:]
    return anchor_id
