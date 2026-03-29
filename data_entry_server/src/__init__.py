import time
import logging
from typing import Any

from flask_restx import Api
from flask import Flask, url_for
from flask import Blueprint
from flask_cors import CORS
import os
from dotenv import load_dotenv
from data_entry_namespace import data_entry_namespace
from mongo_db_init import mongo, init_mongo

logger = logging.getLogger(__name__)


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, static_folder='public')
    CORS(app)  # enable CORS

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


    with app.app_context():
        # setting up a blueprint for your API routes
        api_blueprint = Blueprint('api', __name__, url_prefix='/api')

        # setting up restx API and binding it with blueprint
        api = Api(api_blueprint,
                  version='1.0',
                  title='GS1 Resolver Community Edition API',
                  description='This data entry API enables editing of links made available by Resolver',
                  doc='/docs',  # This enables Swagger UI at /api/docs
                  prefix='')


        # adding namespace (which contains routes) to api
        api.add_namespace(data_entry_namespace)

        # registering api blueprint to app
        app.register_blueprint(api_blueprint)

    return app
