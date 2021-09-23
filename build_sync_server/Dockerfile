FROM node:16-alpine3.14

ENV TZ=Europe/London

# This MongoDb connection is to the local Mongo database within the cluster
ENV MONGODBCONN="mongodb://gs1resolver:gs1resolver@resolver-mongo-service"

# Change this fully qualified domain name to match the web domain where you will be hosting the application
ENV RESOLVER_FQDN="http://localhost"

# SQL Azure database connection variables - DEV only for use on local Docker
ENV SQLDBCONN_USER="sa"
ENV SQLDBCONN_PASSWORD="its@SECR3T!"
ENV SQLDBCONN_SERVER="resolver-sql-server"
ENV SQLDBCONN_DB="gs1-resolver-ce-v2-1-db"

# This batch size is how many entries from the data entry db will be processed in a batch table rows.
# Smaller sizes keep the amount of sata transferred by each request lower as well as keep the data entry
# database better performing, but smaller numbers will cause the processing to take longer overall.
ENV SQLDB_PROCESS_BATCH_SIZE=1000

# BUILD_INTERVAL_SECONDS sets how often the build event will be started (if idle). Additionally, if running several
# Build containers in Docker or Kubernetes, BUILD_MAX_ENTROPY_SECONDS stores the maximum extra seconds
# the Build should be delayed for at every build interval. At every interval, a random number between 0 and
# this value is generated.  This 'entropy' enables workload to be shared more eevenly amongst Build containers
# otherwise Build container 1 will always start its interval before Build container 2, 3, ... and n, and will
# always detect DB changes first as the subsequent containers will be running behind.
ENV BUILD_INTERVAL_SECONDS=10
ENV BUILD_MAX_ENTROPY_SECONDS=10

RUN mkdir /buildsync
COPY *.json /buildsync/
WORKDIR /buildsync
RUN npm install

COPY src /buildsync/src

HEALTHCHECK CMD curl http://localhost/healthcheck || exit 1

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container
# keeps going until it is forced-stopped.
ENTRYPOINT ["node","/buildsync/src/index.js"]
