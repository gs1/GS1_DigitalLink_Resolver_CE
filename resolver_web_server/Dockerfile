FROM node:14.4-stretch

ENV TZ=Europe/London
# These two environment variables must point to the K8s DNS Service name for Mongo and Build Dync servers
ENV MONGODBCONN="mongodb://gs1resolver:gs1resolver@resolver-mongo-service"
ENV PORT=80

RUN apt-get update && apt-get -y install curl dos2unix && apt-get autoremove

RUN mkdir /resolver
COPY templates /resolver/templates
COPY package-lock.json /resolver
COPY package.json /resolver

WORKDIR /resolver
RUN npm install

COPY src /resolver/src

RUN date > /resolver/src/builddatetime.txt


# Convert text files' format to linux from DOS
RUN find /resolver/* -type f -print0 | xargs -0 dos2unix

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container
# keeps going until it is forced-stopped.
CMD ["node","/resolver/src/index.js"]
