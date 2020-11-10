FROM node:15.1.0-alpine3.12

ENV TZ=Europe/London
# These two environment variables ensure that the installation of the packages we need is all automatic and doesn't need
# any interaction from us:

RUN mkdir /app
COPY package.json /app
WORKDIR /app
RUN npm install

COPY src /app

# Run Node (not NPM) to start the server.
# If the usual practice of 'npm start' is used, any SIGTERM arriving to stop the
# container in a controlled manner is instead absorbed by NPM and the container

# keeps going until it is SIGTERMed
ENTRYPOINT ["node","/app/index.js"]