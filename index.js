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

var io = require("socket.io")(server);

server.listen(config.port, config.server, function () {
    console.log('Server listning at ' + config.server + ':' + config.port);
});

io.on('connection', function (socket) {
    console.log('Socket connected');
    socket.on('sendmessage', function (data) {
        console.log('message received');
        io.emit('getmessage', data);
    });
});

