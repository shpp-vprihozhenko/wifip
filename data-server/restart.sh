#!/bin/bash

FILENAME="index.js"

cd `dirname $0`
thisdir=`pwd`
if [[ -f "$thisdir/pid.txt" ]]; then
    pid=`cat $thisdir/pid.txt`;
    kill $pid
    echo "killed $pid"
    sleep 3
fi

node ${thisdir}/$FILENAME >>${thisdir}/logs.txt 2>&1 &
echo $! >${thisdir}/pid.txt

echo "server is started"