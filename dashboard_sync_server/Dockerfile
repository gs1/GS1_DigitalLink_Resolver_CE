FROM node:16-alpine3.14

ENV TZ=Europe/London

# This MongoDb connection is to the local Mongo database within the cluster
ENV MONGODBCONN="mongodb://gs1resolver:gs1resolver@resolver-mongo-service"
ENV RESOLVER_FQDN="http://localhost"


RUN mkdir /dashboardsync
COPY *.json /dashboardsync/
WORKDIR /dashboardsync
RUN npm install
COPY src /dashboardsync/src

CMD [ "node", "/dashboardsync/src/dashboard.js" ]
