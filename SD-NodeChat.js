/**
 * @package      SD-NodeChat
 *
 * @author       Saurin Dashadia (SD) (http://saur.in)
 * @copyright    Copyright (C) 2014 Saurin Dashadia. All rights reserved.
 * @license      http://opensource.org/licenses/MIT, see LICENSE
 */

var SDNodeChat = {
    _http   : require("http"),
    _fs     : require("fs"),
    _server : {},
    config  : {},

    /**
     *
     * @param msg
     * @param msgType
     * @param isDebug
     * @returns void
     * @usage This function is used to log application activity.
     */
    logMessage: function(msg, msgType, isDebug){

        //check if local debug flag is set, else use config value.
        if(typeof isDebug === 'undefined') isDebug = this.config.debug;

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
    },

    /**
     *
     * @param req
     * @param res
     * @returns void
     * @usage callback function for http.createServer
     */
    createServer_cb: function(req, res){
        switch (req.url) {
            case '/css/style.css':
                res.writeHead('200', {"content-Type": "text/css"});
                SDNodeChat._fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                    res.end(data)
                });
                SDNodeChat.logMessage('CSS file served.');
                break;

            case '/js/script.js':
                res.writeHead('200', {"content-Type": "application/javascript"});
                SDNodeChat._fs.readFile("./assets" + req.url, {"encoding": "utf8"}, function (error, data) {
                    res.end(data)
                });
                SDNodeChat.logMessage('JavaScript file served.');
                break;

            case '/favicon.ico':
                break;

            case '/':
            default:
                res.writeHead('200', {"content-Type": "text/html"});
                SDNodeChat._fs.readFile("./templates/chat.html", {"encoding": "utf8"}, function (error, data) {
                    res.end(data)
                });
                SDNodeChat.logMessage('Main template served.');
                break;
        }
    }
};

// fetch configuration from config.json file.
SDNodeChat.config = JSON.parse( SDNodeChat._fs.readFileSync("config.json", "UTF8") );

// create server.
SDNodeChat._server = SDNodeChat._http.createServer(function(req, res){
    SDNodeChat.createServer_cb(req,res)
});

if(SDNodeChat.config.server && SDNodeChat.config.port){
    SDNodeChat._server.listen(SDNodeChat.config.port, SDNodeChat.config.server, function () {
        SDNodeChat.logMessage('Server listning at ' + SDNodeChat.config.server + ':' + SDNodeChat.config.port);
    });
}else if(!SDNodeChat.config.server && SDNodeChat.config.port){
    SDNodeChat._server.listen(SDNodeChat.config.port, function () {
        SDNodeChat.logMessage('Server listning at port' + SDNodeChat.config.port);
    });
}else{
    SDNodeChat.logMessage('SD-NodeChat application needs minimum a port number to create a server.', 'Error');
    SDNodeChat.logMessage('Please refer the documentation here https://github.com/devsaurin/SD-NodeChat', 'Note');
}

// current userlist
var users = [];
var io = require("socket.io")(SDNodeChat._server);

io.on('connection', function (socket) {
    var clientID = socket.id;
    var clientIP = socket.request.connection.remoteAddress;
    var userAdded = false;
    var username = '';

    SDNodeChat.logMessage('New user connected from server: ' + clientIP);

    // set intro sent by client
    socket.on('addUser', function (data) {
        SDNodeChat.logMessage('Received user info');
        if(users.indexOf(data.username) === -1){
            // if usename is not in use add to users
            users.push(data.username);
            userAdded = true;
            username = data.username;

            SDNodeChat.logMessage('User "' + username + '" added.');

            // broadcast new user joint
            socket.broadcast.emit('newUser', {username:username});
        }

        this.emit('userAdded',{username:username,success:userAdded});
    });

    socket.on('userList', function () {

        SDNodeChat.logMessage('Received request for online users.');

        this.emit('userList', JSON.stringify(users));

        SDNodeChat.logMessage('Online user list sent.');
    });

    // send received message to all clients.
    socket.on('newMsg', function (data) {

        SDNodeChat.logMessage('New message received.');

        socket.broadcast.emit('newMsg', data);

        SDNodeChat.logMessage('Message broadcast done.');
    });

    socket.on('disconnect', function(){
        SDNodeChat.logMessage('User "' + username + '" left.');

        delete users[users.indexOf(username)];

        // remove undefined entry from array
        users.sort().pop();

        //broadcast on user left chat
        socket.broadcast.emit('userLeft', {username:username});
    })
});