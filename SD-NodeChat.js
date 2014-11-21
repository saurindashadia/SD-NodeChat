/**
 * @package      SD-NodeChat
 *
 * @author       Saurin Dashadia (SD) (http://saur.in)
 * @copyright    Copyright (C) 2014 Saurin Dashadia. All rights reserved.
 * @license      http://opensource.org/licenses/MIT, see LICENSE
 */

var http = require("http");
var fs = require("fs");
var config = JSON.parse(fs.readFileSync("config.json", "UTF8"));

var logMessage = function(msg, msgType, isDebug){
    //check if local debug flag is set, else use config value.
    if(typeof isDebug === 'undefined') isDebug = config.debug;

    //log only if debug is true.
    if(isDebug){
        // get date object
        var d = new Date();
        // get full date in format 'YYYY-MM-DD hh:mm:ss'
        var t = d.getFullYear() + '-' + ("0" + d.getMonth()).slice(-2) + '-' + ("0" + d.getDate()).slice(-2) + ' ' + ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);

        // capitalize first character
        msgType = (msgType) ? (msgType.charAt(0).toUpperCase() + msgType.slice(1).toLowerCase()) : 'Error';
        // get 8 charcter log string
        msgType = (msgType + '        ').slice(8) + ':    ';

        // log message
        console.log('(' + t + ') ' + msgType + msg);
    }
}

var server = http.createServer(function (req, res) {
    switch (req.url) {
        case '/css/style.css':
            res.writeHead('200', {"content-Type": "text/css"});
            fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            logMessage('CSS file served.');
            break;

        case '/js/script.js':
            res.writeHead('200', {"content-Type": "application/javascript"});
            fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            logMessage('JavaScript file served.');
            break;

        case '/':
        default:
            res.writeHead('200', {"content-Type": "text/html"});
            fs.readFile("./templates/chat.html", {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            logMessage('Main template served.');
            break;
    }
});

if(config.server && config.port){
    server.listen(config.port, config.server, function () {
        logMessage('Server listning at ' + config.server + ':' + config.port);
    });
}else if(!config.server && config.port){
        server.listen(config.port, function () {
            logMessage('Server listning at port' + config.port);
        });
}else{
    logMessage('SD-NodeChat application needs minimum a port number to create a server.', 'Error');
    logMessage('Please refer the documentation here https://github.com/devsaurin/SD-NodeChat', 'Note');
}

var clients = [];
var currentClients = [];
var clientID = null;
var clientIP = null;

var io = require("socket.io")(server);

io.on('connection', function (socket) {
    clientID = socket.id;
    clientIP = socket.request.connection.remoteAddress;

    // check if connected client is known to system
    if (currentClients.indexOf(clientIP) === -1) {

        logMessage('New client connected from server: ' + clientIP);

        socket.emit('getIntro');

        logMessage('Ask for client intro.');
    }

    // set intro sent by client
    socket.on('setIntro', function (data) {

        clients[clientID] = {
            id: clientID,
            name: data.name,
            ip: clientIP
        };

        logMessage('Received client intro.');

        currentClients.push(clientIP);
    });

    socket.on('requestOnlineUsers', function () {

        logMessage('Received request for online users.');

        var friendlist = [];
        for (x in clients) {
            friendlist.push(clients[x].name);
        }
        this.emit('receiveOnlineUsers', JSON.stringify(friendlist));

        logMessage('Online user list sent.');
    });

    // send received message to all clients.
    socket.on('sendMessage', function (data) {

        logMessage('New message received.');

        data.message = '<p class="name">' + clients[data.sender]['name'] + '</p>&nbsp;&nbsp;&nbsp;' + data.message;
        io.emit('receiveMessage', data);

        logMessage('Message broadcast done.');
    });

    socket.on('disconnect', function(){
        logMessage('Client left. ' + clients[clientID]);
        delete clients[clientID];
    })
});

