#!/bin/bash
killall -SIGTERM node
killall -SIGTERM python
rm -rf logs/*
(node_modules/peer/bin/peerjs  --port 9000 --key peerjs -d > logs/peerjs.log.txt 2> logs/http.err.txt) &
(python -m SimpleHTTPServer 8000 > logs/http.log.txt 2> logs/http.err.txt) &