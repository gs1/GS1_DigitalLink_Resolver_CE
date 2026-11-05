from flask_restx import Api
from flask import Flask, Response
from flask import Blueprint
from flask_cors import CORS
import logging
import os
from typing import Any
from web_namespace import web_namespace
from db_init import init_db

logger = logging.getLogger(__name__)


def create_app(test_config: dict[str, Any] | None = None) -> Flask:
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True, static_folder='public')

    # turn off requiring different routes if the URL ends with a '/'.
    # This will affect all routes, ensuring that any request URL with a trailing slash is matched to its non-slash counterpart.
    app.url_map.strict_slashes = False

    # Enable CORS (cross-site scripting allowed)
    CORS(app)

    server_description = f"The web server is running at https://{os.getenv('FQDN', 'set-domain-name-in-env-variable-FQDN.com')}"
    logger.info(server_description)

    # initialise the database connection (MongoDB or PostgreSQL, selected by the DB_BACKEND environment variable)
    init_db(app)

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
    def add_headers(response: Response) -> Response:
        response.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        return response

    return app
