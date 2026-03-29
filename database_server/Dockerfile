# Description: This file contains the Dockerfile for the Mongo 7 database server.
# The server runs on port 27017 and is exposed by docker-compose.yml if you want to take backups.
# The root username and password are set via the .env file (see .env.example).
# mongodump --host localhost:27017 --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --archive=mongobackup.tar.gz --gzip
FROM mongo:7-jammy
LABEL authors="nick"
ENV DEBIAN_FRONTEND=noninteractive
ENV ACCEPT_EULA=Y

# Set the TZDATA value to the continent/city matching your own timezone
ENV TZ=Europe/London

# Update and upgrade repositories as needed:
RUN apt-get update -y && apt-get dist-upgrade -y
