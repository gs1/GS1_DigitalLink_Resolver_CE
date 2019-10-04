for PORTNUMBER in {3000..3009}
do
    if( [[ $(curl -s  "http://localhost:$PORTNUMBER/status" &> /dev/stdout) != "{Response: Running}" ]])
    then
        echo Server on $PORTNUMBER is Stopped
    else
        echo Server on $PORTNUMBER is RUNNING
        curl -s http://localhost:$PORTNUMBER/gtin/05000169073117/cpv/123/lot/456/ser/789?exp=190123&linktype=ePil  &> /dev/stdout
        echo "\n"
    fi
done
