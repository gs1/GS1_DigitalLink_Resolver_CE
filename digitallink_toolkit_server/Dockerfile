FROM node:15.11.0-alpine3.13

ENV TZ=Europe/London

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