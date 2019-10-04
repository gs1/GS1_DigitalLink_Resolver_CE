# Welcome to the Dockerfile script that will get the GS1 Resolver's Digital Link Tookit.
# This simple node.js web server is designed for internal use only by the id_gs1_org as an alternative
# We'll be using node 12.10 and the tiny alpine linux image
FROM node:12.10-alpine

RUN apk add curl dos2unix

RUN mkdir /gs1dl
COPY GS1DigitalLinkToolkit.js /gs1dl
COPY server.js /gs1dl
COPY digilink_toolkit_servers_start.sh /gs1dl
COPY digilink_toolkit_servers_status.sh /gs1dl

RUN find /gs1dl/* -type f -print0 | xargs -0 dos2unix

# Open ports 3000 to 3009 on the container
EXPOSE 3000/tcp
EXPOSE 3001/tcp
EXPOSE 3002/tcp
EXPOSE 3003/tcp
EXPOSE 3004/tcp
EXPOSE 3005/tcp
EXPOSE 3006/tcp
EXPOSE 3007/tcp
EXPOSE 3008/tcp
EXPOSE 3009/tcp

# Finally set the server running
CMD ["/bin/ash", "/gs1dl/digilink_toolkit_servers_start.sh"]
