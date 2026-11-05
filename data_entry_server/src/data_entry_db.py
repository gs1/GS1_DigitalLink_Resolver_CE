from db_init import DB_BACKEND

# This script exposes the four CRUD functions (plus read_index) of the database backend selected
# with the DB_BACKEND environment variable. Both backends return the same
# {"response_status": <int>, "data"|"error": ...} dictionaries.
if DB_BACKEND == 'mongo':
    from data_entry_db_mongo import create_document, read_document, read_index, update_document, delete_document
elif DB_BACKEND == 'postgres':
    from data_entry_db_postgres import create_document, read_document, read_index, update_document, delete_document
else:
    raise RuntimeError(f"Unsupported DB_BACKEND '{DB_BACKEND}': use 'mongo' or 'postgres'")

__all__ = ['create_document', 'read_document', 'read_index', 'update_document', 'delete_document']
