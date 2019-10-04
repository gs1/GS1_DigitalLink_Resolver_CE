#!/usr/bin/env bash
for PORTNUMBER in {3000..3009}
do
    if( [[ $(curl -s  "http://localhost:$PORTNUMBER/status" &> /dev/stdout) != "{Response: Running}" ]])
    then
        echo Starting server on $PORTNUMBER
        node /var/www/digitallink_toolkit/server.js $PORTNUMBER &
    else
        echo Digital Link Server on $PORTNUMBER is already running
    fi
done
