from flask_pymongo import PyMongo

mongo = PyMongo()


def init_mongo(app):
    mongo.init_app(app, uri=app.config["MONGO_URI"])
