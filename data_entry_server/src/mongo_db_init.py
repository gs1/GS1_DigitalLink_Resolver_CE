from flask_pymongo import PyMongo

mongo = PyMongo()


def init_mongo(app):
    print('Debug - about to set up the collection')
    global resolver_db, resolver_coll
    mongo.init_app(app, uri=app.config["MONGO_URI"])
