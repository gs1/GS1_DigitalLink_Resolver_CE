FROM node:latest

ENV TZ=Europe/London

# The web server will be running internally on port 80
ENV PORT=80

# SQL Azure database connection variables - DEV only
ENV SQLDBCONN_USER="sa"
ENV SQLDBCONN_PASSWORD="its@SECR3T!"
ENV SQLDBCONN_SERVER="resolver-sql-server"
ENV SQLDBCONN_DB="gs1-resolver-ce-v2-db"

# Make sure we have patches the container and instal cuel and dos2unix
RUN apt-get update && apt-get -y install curl dos2unix && apt-get autoremove

# copy the package information config file for use with npm install
RUN mkdir   /app
COPY package-lock.json /app
COPY package.json /app
WORKDIR /app

#Install all the necessary dependendies described in package.json
RUN npm install

# Copy in the application
COPY app.js /app/
COPY bin    /app/bin
COPY db     /app/db
COPY public /app/public
COPY routes /app/routes
COPY views  /app/views

# This saves the build date/time into a file within the container
RUN date > /app/builddatetime.txt

# Convert text files' format to linux from DOS
RUN find /app/* -type f -print0 | xargs -0 dos2unix

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container
# keeps going until it is forced-stopped.
CMD ["node","/app/bin/www"]
