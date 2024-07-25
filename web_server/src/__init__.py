import time

from flask_restx import Api
from flask import Flask, url_for
from flask import Blueprint
from flask_cors import CORS  # new
import logging
import os
from dotenv import load_dotenv
from web_namespace import data_entry_namespace
from mongo_db_init import mongo, init_mongo


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, static_folder='public')
    CORS(app)  # enable CORS

    mongo_url = os.getenv('MONGO_URI', "mongodb://gs1resolver:gs1resolver@database-server:27017")
    logging.info(f"Connecting to MongoDB at {mongo_url}")
    print("Connecting to MongoDB at", mongo_url)
    app.config["MONGO_URI"] = mongo_url
    app.config["MONGO_DBNAME"] = "resolver_ce"

    # initialise the MongoDB connection
    init_mongo(app)
    resolver_db = mongo.cx['resolver_ce']
    print('database set up: ', resolver_db)
    resolver_coll = resolver_db['gs1resolver']
    print('Debug - collection set up: ', resolver_coll)
    print('create_app() - collection set up: ', resolver_coll)

    # prints server host and port
    print(f"Server info: {mongo.cx.server_info()}")
    # Print out the database used in MongoClient
    print("Database is:", mongo.cx.database)

    # now test write a document to Mongo - comment out if you want the web server to have read-only access
    resolver_coll.insert_one({"web_test": "web_test"})
    print("Document inserted")
    # now test read the document from Mongo
    print(resolver_coll.find_one({"web_test": "web_test"}))
    print("Document read")
    # now test delete the document from Mongo
    resolver_coll.delete_one({"web_test": "web_test"})
    print("Document deleted")


    with app.app_context():
        # setting up a blueprint for your API routes
        api_blueprint = Blueprint('api', __name__, url_prefix='/api')

        # setting up restx API and binding it with blueprint
        api = Api(api_blueprint, version='1.0', title='GS1 Resolver Community Edition API', description='')

        # adding namespace (which contains routes) to api
        api.add_namespace(data_entry_namespace)

        # registering api blueprint to app
        app.register_blueprint(api_blueprint)

    return app
