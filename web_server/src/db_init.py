import logging
import os

from flask import Flask

logger = logging.getLogger(__name__)

# The database backend is selected with the DB_BACKEND environment variable: 'mongo' (default) or 'postgres'.
DB_BACKEND = os.getenv('DB_BACKEND', 'mongo').strip().lower()


def init_db(app: Flask) -> None:
    if DB_BACKEND == 'mongo':
        from mongo_db_init import init_mongo

        mongo_url = os.getenv('MONGO_URI')
        if not mongo_url:
            raise RuntimeError("MONGO_URI environment variable is not set")
        # Log the host only — do not log credentials
        mongo_host = mongo_url.split('@')[-1] if '@' in mongo_url else mongo_url
        logger.info("Connecting to MongoDB at %s", mongo_host)
        app.config["MONGO_URI"] = mongo_url
        app.config["MONGO_DBNAME"] = "resolver_ce"

        # initialise the MongoDB connection
        init_mongo(app)
        logger.info("MongoDB connection initialised")
    elif DB_BACKEND == 'postgres':
        from postgres_db_init import init_postgres

        init_postgres()
    else:
        raise RuntimeError(f"Unsupported DB_BACKEND '{DB_BACKEND}': use 'mongo' or 'postgres'")
