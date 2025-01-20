from flask_restx import Api
from flask import Flask
from flask import Blueprint
from flask_cors import CORS  # new
import logging
import os
from web_namespace import web_namespace
from mongo_db_init import mongo, init_mongo


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, static_folder='public')

    # turn off requiring different routes if the URL ends with a '/'.
    # This will affect all routes, ensuring that any request URL with a trailing slash is matched to its non-slash counterpart.
    app.url_map.strict_slashes = False

    # Enable CORS (cross-site scripting allowed)
    CORS(app)

    server_description = f"The web server is running at https://{os.getenv('FQDN', 'set-domain-name-in-env-variable-FQDN.com')}"
    print(server_description)

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

    server_description = f"The web server is running at https://{os.getenv('FQDN', 'set-domain-name-in-env-variable-FQDN.com')}"

    with app.app_context():
        # setting up a blueprint for your API routes
        # If this server is going to run standalone and not by proxied the NGINX proxy server in this project,
        # then you can change your url_prefix to '/', otherwise your GS1 Digital Link URLs would have to be prefixed
        # with '/api' which is not the standard way to use GS1 Digital Link URLs. The reason for '/api' is for use
        # with the NGINX proxy server in this project with this setting:
        #   location / {
        #                  proxy_pass http://web-service:4000/api/; <-- this is the /api prefix in use
        #                  proxy_buffer_size 16k;
        #                  proxy_buffers 4 16k;
        #                  proxy_busy_buffers_size 16k;
        #              }
        api_blueprint = Blueprint('api', __name__, url_prefix='/api')

        # setting up restx API and binding it with blueprint
        api = Api(api_blueprint, version='1.0', title='GS1 Resolver Community Edition API', description='')

        api.doc(
            description=f"{server_description}.\n\n"

        )

        # adding namespace (which contains routes) to api
        api.add_namespace(web_namespace)

        # registering api blueprint to app
        app.register_blueprint(api_blueprint)

    @app.after_request
    def add_headers(response):
        response.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        return response

    return app
