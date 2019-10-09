# Welcome to the Dockerfile script that will get the GS1 Resolver's Digital Link Tookit.
# This simple node.js web server is designed for internal use only by the id_gs1_org container
# which it uses to discern the various digital link attributes from an incoming resolve request.
# For performance reasons, the toolkit application is run 10 times, using 10 differnt IP port numbers
# used randomly by parallel incoming requests to id_gs1_org container.
# (see PHP code in class id_gs1_org/resolver/ClassGS1DigitalLink.php for programmatic details)

# We'll be using node 12.10 and the tiny alpine linux image
FROM node:12.10-alpine

RUN apk add curl dos2unix logrotate

RUN mkdir /gs1dl
COPY GS1DigitalLinkToolkit.js /gs1dl
COPY server.js /gs1dl

# Copy the digital link startup snd status scripts
COPY digilink_toolkit_servers_start.sh /gs1dl
COPY digilink_toolkit_servers_status.sh /gs1dl

# Copy the log rotate config files and 'starting' log file
COPY logrotate_dlserver /etc/logrotate.d/dlserver
RUN dos2unix /etc/logrotate.d/dlserver
COPY dlserver.log /var/log/dlserver.log
RUN dos2unix /var/log/dlserver.log

# Convert text file format to linux from DOS
RUN find /gs1dl/* -type f -print0 | xargs -0 dos2unix

# Open ports 3000 to 3009 on the container
# This is an internal server supporting id_gs1_org so ONLY expose the 10 port numbers
# ahould you want this container available on a different network or exposed to the internet
# (so NOT recommended!)
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
