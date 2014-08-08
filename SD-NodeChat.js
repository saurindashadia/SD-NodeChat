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
            console.log('Info    :    CSS file served.');
            break;

        case '/js/script.js':
            res.writeHead('200', {"content-Type": "application/javascript"});
            fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            console.log('Info    :    JavaScript file served.');
            break;

        case '/':
        default:
            res.writeHead('200', {"content-Type": "text/html"});
            fs.readFile("./templates/chat.html", {"encoding": "utf8"}, function (error, data) {
                res.end(data)
            });
            console.log('Info    :    Main template served.');
            break;
    }
});

if(config.server && config.port){
    server.listen(config.port, config.server, function () {
        console.log('Server listning at ' + config.server + ':' + config.port);
    });
}else if(!config.server && config.port){
        server.listen(config.port, function () {
            console.log('Server listning at port' + config.port);
        });
}else{
    console.log('Error   :    SD-NodeChat application needs minimum a port number to create a server.');
    console.log('Note    :    Please refer the documentation here https://github.com/devsaurin/SD-NodeChat');
}

var clients = [];
var currentClients = [];
var clientID = null;
var clientIP = null;

var io = require("socket.io")(server);

io.on('connection', function (socket) {
    clientID = socket.id;
    clientIP = socket.request.connection.remoteAddress;

    console.log('Info    :    New client connected from server: ' + clientIP);

    // check if connected client is known to system
    if (currentClients.indexOf(clientIP) === -1) {
        socket.emit('getIntro');

        console.log('Info    :    Ask for client intro.');
    }

    // set intro sent by client
    socket.on('setIntro', function (data) {

        console.log('Info    :    Received client intro.');

        clients[clientID] = {
            id: clientID,
            name: data.name,
            ip: clientIP
        };

        currentClients.push(clientIP);
    });

    socket.on('requestOnlineUsers', function () {

        console.log('Info    :    Received request for online users.');

        var friendlist = [];
        for (x in clients) {
            friendlist.push(clients[x].name);
        }
        this.emit('receiveOnlineUsers', JSON.stringify(friendlist));

        console.log('Info    :    Online user list sent.');
    });

    // send received message to all clients.
    socket.on('sendMessage', function (data) {

        console.log('Info    :    New message received.');

        data.message = '<p class="name">' + clients[data.sender]['name'] + '</p>&nbsp;&nbsp;&nbsp;' + data.message;
        io.emit('receiveMessage', data);

        console.log('Info    :    Message broadcast done.');
    });
});

