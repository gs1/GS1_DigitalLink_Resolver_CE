from db_init import DB_BACKEND

# This script exposes the read_document function of the database backend selected
# with the DB_BACKEND environment variable. Both backends return the same
# {"response_status": <int>, "data"|"error": ...} dictionaries.
if DB_BACKEND == 'mongo':
    from web_db_mongo import read_document
elif DB_BACKEND == 'postgres':
    from web_db_postgres import read_document
else:
    raise RuntimeError(f"Unsupported DB_BACKEND '{DB_BACKEND}': use 'mongo' or 'postgres'")

__all__ = ['read_document']
