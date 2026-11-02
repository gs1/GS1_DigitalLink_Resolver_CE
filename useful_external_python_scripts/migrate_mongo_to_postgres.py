import argparse
import json
import os

import psycopg
from psycopg.types.json import Json
from pymongo import MongoClient

# Copies every resolver document from the MongoDB 'gs1resolver' collection to the PostgreSQL 'gs1resolver' table,
# so you can switch the data entry and web services from DB_BACKEND=mongo to DB_BACKEND=postgres.
# Existing rows with the same id are overwritten, so the script can safely be run again.
#
# Requirements: pip install pymongo "psycopg[binary]"
# Example:
#   python migrate_mongo_to_postgres.py --mongo-uri mongodb://gs1resolver:gs1resolver@localhost:27017 \
#       --postgres-url postgresql://gs1resolver:gs1resolver@localhost:5432/resolver_ce


def migrate(mongo_uri, mongo_db, mongo_collection, postgres_url):
    documents = MongoClient(mongo_uri)[mongo_db][mongo_collection]
    with psycopg.connect(postgres_url) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS gs1resolver (id TEXT PRIMARY KEY, doc JSON NOT NULL)")
        count = 0
        for document in documents.find():
            conn.execute("INSERT INTO gs1resolver (id, doc) VALUES (%s, %s) "
                         "ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc",
                         (document['_id'], Json(document, dumps=lambda obj: json.dumps(obj, default=str))))
            count += 1
    print(f"Migrated {count} documents")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Copy the resolver documents from MongoDB to PostgreSQL")
    parser.add_argument('--mongo-uri', default=os.getenv('MONGO_URI'), help="MongoDB connection string (default: $MONGO_URI)")
    parser.add_argument('--mongo-db', default='resolver_ce', help="MongoDB database name")
    parser.add_argument('--mongo-collection', default='gs1resolver', help="MongoDB collection name")
    parser.add_argument('--postgres-url', default=os.getenv('DATABASE_URL'), help="PostgreSQL connection string (default: $DATABASE_URL)")
    args = parser.parse_args()
    if not args.mongo_uri or not args.postgres_url:
        parser.error("both --mongo-uri and --postgres-url (or the MONGO_URI and DATABASE_URL environment variables) are required")
    migrate(args.mongo_uri, args.mongo_db, args.mongo_collection, args.postgres_url)
