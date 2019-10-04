#!/usr/bin/env bash
for PORTNUMBER in {3000..3009}
do
   if( [[ $(curl -s  "http://localhost:$PORTNUMBER/status" &> /dev/stdout) == "{Response: Running}" ]])
   then
        echo Stopping server on $PORTNUMBER
        curl -s  "http://localhost:$PORTNUMBER/stop" > /dev/null 2>&1
    fi
done
