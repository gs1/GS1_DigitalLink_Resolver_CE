FROM node:latest

ENV TZ=Europe/London
# These two environment variables ensure that the installation of the packages we need is all automatic and doesn't need
# any interaction from us:
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# The user and password for Mongo is set in resolver_mongo_server/Dockerfile
ENV MONGODBCONN="mongodb://gs1resolver:gs1resolver@resolver-mongo-server"

# The USER and PASSWORD for SQL server is set in resolver_sql_server/Dockerfile
ENV SQLDBCONN_USER="sa"
ENV SQLDBCONN_PASSWORD="its@SECR3T!"
ENV SQLDBCONN_SERVER="resolver-sql-server"
ENV SQLDBCONN_DB="gs1-resolver-ce-v2-db"

# This batch size is how many entries fromo the data entry db will be processed in a batch table rows.
# Smaller sizes keep the amount of sata transferred by each request lower as well as keep the data entry
# database better performing, but smaller numbers will cause the processing to take longer overall.
ENV SQLDB_PROCESS_BATCH_SIZE=1000

# This value sets how often the build event will be started (if idle)
ENV BUILD_INTERVAL_SECONDS=60

RUN apt-get update && apt-get -y install curl dos2unix  apt-transport-https ca-certificates cron && apt-get autoremove

RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
RUN curl https://packages.microsoft.com/config/debian/9/prod.list > /etc/apt/sources.list.d/mssql-release.list
RUN apt-get update && apt-get -y install msodbcsql17 mssql-tools
RUN echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bash_profile
RUN echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
RUN apt-get -y install unixodbc-dev

RUN mkdir /buildsync
COPY package-lock.json /buildsync
COPY package.json /buildsync
WORKDIR /buildsync
RUN npm install

COPY src /buildsync/src
RUN find /buildsync/src/* -type f -print0 | xargs -0 dos2unix

HEALTHCHECK CMD curl http://localhost/healthcheck || exit 1

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container

# keeps going until it is forced-stopped.
ENTRYPOINT ["node","/buildsync/src/index.js"]