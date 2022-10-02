"use strict";

process.title = 'webrtc_video_chat';

// dependencies
var cors = require('cors');
var fs = require('fs');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var log4js = require("log4js");
var webSocketServer = require('websocket').server;


// Default Ports
var httpPort = 8001;
var wsPort = 8002;
var wssPort = 8003;
var httpsPort = 8043;


// Command arguments: --ws_port=8002  --http_port=8003 --https_port=8043
process.argv.forEach(function(val,index,array){
  if(val=="--ws_port"){
      var inputServerPort = array[index+1];
      if(inputServerPort!=null && inputServerPort>0)
          wsPort = inputServerPort;
  } else if(val=="--http_port"){
    var inputServerPort = array[index+1];
    if(inputServerPort!=null && inputServerPort>0)
      httpPort = inputServerPort;
  } else if(val=="--https_port"){
    var inputServerPort = array[index+1];
    if(inputServerPort!=null && inputServerPort>0)
      httpsPort = inputServerPort;
  }
});


// Make configure of log
log4js.configure({
  appenders: {
      'stdout': { type: 'stdout' },
      'thinclient': {
        filename: __dirname+"/logs/media_metrics.log",
        type: 'dateFile',
        pattern: "yyyy-MM-dd",
        keepFileExt: true,
        maxLogSize: 1024 * 1024 * 20, //1024 * 1024 * 2 = 20M
        backups: 100,
        alwaysIncludePattern: true,
        daysToKeep: 7,
        layout: {
          type    : "pattern",
          pattern : "%d{ABSOLUTE} %[%-5p%] %c %x{singleLine}",
          tokens: {
            singleLine : function(logEvent) {
              // logEvent.data is an array that contains the arguments to the log.info() call
              return  JSON.stringify(logEvent.data[0]);
            }
          }
        }
      },
      'webconsole': {
          type: 'dateFile',
          filename: __dirname+"/logs/webconsole.log",
          pattern: "yyyy-MM-dd",
          keepFileExt: true,
          alwaysIncludePattern: true,
          daysToKeep: 7,
          layout: {
            type: 'pattern',
            pattern: '%m'
          }
      }
    },
    categories: {
        default: {
          appenders: ["stdout","thinclient", "webconsole"],
          level: "info"
        }
    }
  });


Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


const logger = log4js.getLogger("thinclient");
const webConsoleLogger = log4js.getLogger("webconsole");

const certificate = fs.readFileSync('./certs/domain.crt', 'utf8');
const privateKey  = fs.readFileSync('./certs/domain.key', 'utf8');

const credentials = {key: privateKey, cert: certificate};
const express = require('express');
const app = express();
const path = require('path');

const options = {
  index: "index.html"
};

app.use(cors({
  origin: '*'
}));

app.use('/', express.static(path.join(__dirname, '/'), options));

// parse requests of content-type - application/x-www-form-urlencoded and application/json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/api/v1/ping', (req, res) => {
  res.json({"message": "Healthy", "serviceState": "online"});
});

app.post('/api/v1/events', function(request, response) {
  var content = request.body;
  console.debug("received event: ", content);      // your JSON
  response.send({"result": "OK"});
  if(content && content["eventType"] === 'log' && content["value"]) {
      var logContent = content["value"].join();
      console.log(logContent);
      webConsoleLogger.info(logContent);
      return;
  }
  logger.info(content);
});

app.post('/metrics/api/*', function(request, response) {
  console.debug("received callipe api: ", request.url, request.body);      // your JSON
  response.send({"result": "OK"});
  var content = {"url": request.url, "content": request.body}
  logger.info(JSON.stringify(content));
});

/**
 * Global variables
 */
var connections = {};

/**
 * HTTP server
 */
var server = http.createServer(function(req, res) {

});
server.listen(wsPort, "0.0.0.0", function() {
    console.log((new Date()) + " WebSocket Server is listening on port " + wsPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server
});


/**
 * WebSocket Secure Server
 */

var secureServer = https.createServer(credentials, function(req, res) {
});

secureServer.listen(wssPort, "0.0.0.0", function() {
  console.log((new Date()) + " Secure WebSocket Server is listening on port " + wssPort);
});

var wssServer = new webSocketServer({
  httpServer: secureServer
});

/**
 *
 * broadcast message to room
 */

function broadcastMessage(roomId, data, self) {
    var peers = connections[roomId].peers;
    var i, c;
    for(i = 0; i < peers.length; i++)
    {
        c = peers[i];
        if(c != self)
            c.sendUTF(data);
    }
}

function broadcastRoster(roomId, self) {
    var peers = connections[roomId].peers;
    var i, c;
    for(i = 0; i < peers.length; i++)
    {
        c = peers[i];
        if(c.publishCmd && c != self) {
            self.sendUTF(c.publishCmd);
        }
    }
}

function broadcastUserCount(connection, roomId) {
    if (!!connection && !!roomId && !!connections[roomId] && !!connections[roomId].peers) {
        broadcastMessage(connection.id, JSON.stringify({type: "join", count: connections[roomId].peers.length}), connection);
    }
}

var wsCallback = function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  var connection = request.accept(null, request.origin);
  var roomId = request.resourceURL.query['r'];

  connection.id = roomId;
  if(! connections[roomId]){
      console.log("no room is found , new array");
      connections[roomId] = {peers:[]};
  }

  connections[roomId].peers.push(connection);
  //request.resourceURL.pathname
  console.log((new Date()) + ' Connection accepted. roomId=' + roomId + ", head count=" + connections[roomId].peers.length);
  connection.sendUTF(JSON.stringify({type: "join", count: connections[roomId].peers.length}));

  if(connections[roomId].subscribeCmd && connections[roomId].subscribeCmd.length > 0)
  {
      console.log("Send to: --" + connections[roomId].subscribeCmd);
      connection.sendUTF(connections[roomId].subscribeCmd);
  }

  broadcastRoster(roomId, connection);

  broadcastUserCount(connection, roomId)
  // user sent some message
  connection.on('message', function(message) {
      var textData;
      if(message.type === 'utf8') {
          textData = message.utf8Data;
      }
      else if (message.type === 'binary') { // accept only text
          textData = new Buffer(message.binaryData, 'binary').toString();
      }
      var cmd = JSON.parse(textData);
      if(cmd.type === "echo")
      {
          connection.sendUTF(JSON.stringify({type: "echo", count: connections[connection.id].peers.length}));
      } else {
          console.log("Got ", cmd);
          if(cmd.type === "subscribe") {
              connections[connection.id].subscribeCmd = JSON.stringify(cmd);
          } else if(cmd.type === "publish") {
              connection.publishCmd = JSON.stringify(cmd);
          }
          broadcastMessage(connection.id, JSON.stringify(cmd), connection);
      }
  });

  // user disconnected
  connection.on('close', function(cn) {
      if(!connections[connection.id]){
          console.log(" close a socket but no room has found for it.");
          return;
      }
      connections[connection.id].peers.remove(connection);
      broadcastUserCount(connection, roomId)
      console.log("connection closed, roomId=" + connection.id + ", room size=" + connections[connection.id].peers.length);
      if(connections[connection.id].peers.length == 0){
          delete connections[connection.id];
      } else {
          if(connection.publishCmd) {
              var command = {
                  type: 'leave',
                  data: JSON.parse(connection.publishCmd).data
              };
              broadcastMessage(connection.id, JSON.stringify(command), connection);
          }
      }
  });
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', wsCallback);
wssServer.on('request', wsCallback);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);


httpServer.listen(httpPort, "0.0.0.0", function() {
  console.log((new Date()) + " HTTP Server is listening on port " + httpPort);
});


httpsServer.listen(httpsPort, "0.0.0.0", function() {
  console.log((new Date()) + " HTTPS Server is listening on port " + httpsPort);
});
