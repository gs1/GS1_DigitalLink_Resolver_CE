FROM node:16-alpine3.14
ENV TZ=Europe/London

# App Insights env config variable (if you wish to use Microsoft Azure App Insights)
ENV INSTRUMENTATION_KEY=""

# The web server will be running internally on port 80
ENV PORT=80

# This API call is where Resolver will request the latest linktypes once every 24 hours
# to retrive the official supported linktypes from the GS1 Web Vocabulary
ENV LINKTYPES_SOURCE_URL="https://www.gs1.org/voc/?show=linktypes"
ENV LINKTYPES_REFRESH_INTERVAL_MINS=1440

# This is the Admin auth key for admin API functions (can be any string value)
ENV ADMIN_AUTH_KEY="MyAdminAuthKey"

# SQL Azure database connection variables - DEV only for use on local Docker
ENV SQLDBCONN_USER="sa"
ENV SQLDBCONN_PASSWORD="its@SECR3T!"
ENV SQLDBCONN_SERVER="resolver-sql-server"
ENV SQLDBCONN_DB="gs1-resolver-ce-v2-1-db"
ENV SQLDBCONN_MAX_POOL=5
ENV SQLDBCONN_MIN_POOL=1

# Rate Limit for API configuration 
ENV RATE_LIMIT_MS=90000
ENV RATE_LIMIT_MAX=5000

# CSP Inline Nonce env configuration e.g. localhost, resolver-st.gs1.org, resolver-qt.gs1.org
ENV CSP_NONCE_SOURCE_URL="localhost"

# Make sure we have patches the container and instal cuel and dos2unix
# RUN apt-get update && apt-get -y install curl && apt-get -y autoremove

# copy the package information config file for use with npm install
RUN mkdir   /app
COPY package.json /app
WORKDIR /app

#Install all the necessary dependendies described in package.json
RUN npm install

# Copy in the application
COPY bin                /app/bin
COPY controller-helper  /app/controller-helper
COPY controllers        /app/controllers
COPY db                 /app/db
COPY middleware         /app/middleware
COPY public             /app/public
COPY routes             /app/routes
COPY utils              /app/utils
COPY views              /app/views
COPY app.js             /app/
COPY package.json       /app/package.json


# This saves the build date/time into a file within the container
RUN date > /app/builddatetime.txt

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container
# keeps going until it is forced-stopped.
CMD ["node","/app/bin/www"]
