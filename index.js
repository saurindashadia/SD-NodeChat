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

var server = http.createServer(function (req, res) {
    switch (req.url) {
        case '/css/style.css':
            res.writeHead('200', {"content-Type": "text/css"});
            fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            break;

        case '/js/script.js':
            res.writeHead('200', {"content-Type": "application/javascript"});
            fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            break;

        case '/':
        default:
            res.writeHead('200', {"content-Type": "text/html"});
            fs.readFile("./templates/chat.html", {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            break;
    }
});

server.listen(config.port, config.server, function () {
    console.log('Server listning at ' + config.server + ':' + config.port);
});

var clients = [];
var currentClients = [];
var clientID = null;
var clientIP = null;

var io = require("socket.io")(server);

io.on('connection', function (socket) {
    clientID = socket.id;
    clientIP = socket.request.connection.remoteAddress;

    // check if connected client is know to system
    if (currentClients.indexOf(clientIP) === -1) {
        socket.emit('getIntro');
    }

    // set intro sent by client
    socket.on('setIntro', function (data) {
        clients[clientID] = {
            id: clientID,
            name: data.name,
            ip: clientIP
        };

        currentClients.push(clientIP);
    });

    socket.on('requestOnlineUsers', function () {
        var friendlist = [];
        for (x in clients) {
            friendlist.push(clients[x].name);
        }
        this.emit('receiveOnlineUsers', JSON.stringify(friendlist));
    });

    // send received message to all clients.
    socket.on('sendMessage', function (data) {
        data.message = '<p class="name">' + clients[data.sender]['name'] + '</p>&nbsp;&nbsp;&nbsp;' + data.message;
        io.emit('receiveMessage', data);
    });
});

