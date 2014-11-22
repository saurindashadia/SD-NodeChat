/**
 * @package      SD-NodeChat
 *
 * @author       Saurin Dashadia (SD) (http://saur.in)
 * @copyright    Copyright (C) 2014 Saurin Dashadia. All rights reserved.
 * @license      http://opensource.org/licenses/MIT, see LICENSE
 */

(function (window, document, $) {

    $.initSDNodeChat = function (options) {

        var _defaults = {

            /**
             * @default     localhost
             * @type        Text
             * @value       server-IP address
             * @usage       This will be consider as default server for chat
             */
            server: "localhost",

            /**
             * @default     80
             * @type        Text
             * @value       Port number
             * @usage       This will be consider as default port for the chat server
             */
            port: "80",

            /**
             * @default     false
             * @type        boolean
             * @value       true/false
             * @usage       This can enable or disable log on server side.
             */
            debug: false,

            /**
             * @default     null
             * @type        Text
             * @value       username
             * @usage       This can enable or disable log on server side.
             */
            username: null,

            /**
             * @default     $('#messages')
             * @type        [object HTMLUListElement]
             * @value       [object HTMLUListElement]
             * @usage       This element will be consider as chat container
             */
            chatContainer: $('#messages'),

            /**
             * @default     $('#SendButtonID')
             * @type        [object HTMLButtonElement]
             * @value       [object HTMLButtonElement]
             * @usage       This element will be consider as an action to send chat
             */
            sendButton: $('#SendButtonID'),

            /**
             * @default     $('#chatTextBoxId')
             * @type        [object HTMLInputElement]
             * @value       [object HTMLInputElement]
             * @usage       This element will be consider as chat input it can also handle action to send chat
             */
            chatBox: $('#chatTextBox'),

            /**
             * @default     true
             * @type        boolean
             * @value       true/false
             * @usage       This can enable or disable enter key as sender on chatBox
             */
            enterToSend: true,

            /**
             * @default     $('#userContainer')
             * @type        [object HTMLUListElement]
             * @value       [object HTMLUListElement]
             * @usage       This element will be consider as a container of online users list.
             */
            usersContainer: $('#userContainer'),


            /**
             * @default     null
             * @type        [object Socket]
             * @value       [object Socket]
             * @usage       This socket object will be use to communicate to server.
             */
            socket: null,

            /**
             * @default     sent=null, received=null
             * @type        [object]
             * @value       [object]
             * @usage       This is common message object for sent and received messages.
             */
            message: {
                sent: null,
                received: null
            },

            /**
             * @default     "Welcome to SD-NodeChat! For more info visit <a href="https://github.com/devsaurin/SD-NodeChat">SD-NodeChat@GitHub</a>"
             * @type        [text]
             * @value       [text]
             * @usage       This is to welcome a new user. It will be ignored if value not present.
             */
            welcomeNote: "Welcome to SD-NodeChat! For more info visit <a href=\"https://github.com/devsaurin/SD-NodeChat\">SD-NodeChat@GitHub</a>",





            /**
             * @param       void
             * @returns     string
             * @usage       This function is to query clients basic info usually a name which can be use to identify
             *              user in chat room
             */
            logMessage: function(msg,isDebug){
                // Follow global debug flag if local flag not set.
                if(typeof isDebug === 'undefined') isDebug = this.debug;
                if(isDebug) console.log(msg);
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function listen to "getIntro" event, which will basically trigger from server.
             *              If server found connected client new/un-known, it will trigger "getIntro" event. Upon
             *              "getIntro" event this function will call getIntro() function and finally it will fetch
             *              friend-list
             * @todo        Define this function private, this function should not be the part of API
             */
            _intro: function () {
                this.socket.emit('addUser', {username: this.username});

                // Request for friend-list
                that.requestOnlineUsers();
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function is use to request list of online users
             */
            requestOnlineUsers: function(){
                this.socket.emit('requestOnlineUsers');
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function is use to set event listener for "receiveOnlineUsers"
             */
            receiveOnlineUsers: function () {
                var that = this;
                that.socket.on('receiveOnlineUsers', function (data) {
                    that.displayUserList(data);
                });
            },

            /**
             * @param       data    {object}
             * @returns     void
             * @usage       This function is use to set friends list
             */
            displayUserList:function(data){
                this.usersContainer.find('li').not('.caption').remove();
                var userList = JSON.parse(data);
                var userListHTML = '';
                for(u in userList){
                    userListHTML += '<li class="online">' + userList[u] + '</li>';
                }
                this.usersContainer.append($(userListHTML));
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function is use to listen for new messages. Upon new message receive, call function to
             *              add message to message container.
             */
            listenForMessages: function () {
                var that = this;
                that.socket.on('receiveMessage', function (data) {
                    // sender should not receive/display the message.
                    if (data.sender != this.io.engine.id) {
                        that.addMessage(data.message, 'other');
                    }
                });
            },

            /**
             *
             * @param       message {text}
             * @param       type    {text} ('self'/'other')
             * @returns     void
             * @usage       This function is use to display message.
             *              There are two ways to display messages
             *              1) type = 'self'    -> indicates message is sent by client itself.
             *              2) type = 'other'   -> indicates message is received from server.
             */
            addMessage: function (message, type) {
                var li = '<li class="' + type + '"><span>' + message + '</span></li>';
                $(this.chatContainer).append($(li));
                // scroll to new content
                this.scroller();
            },


            /**
             * @param       void
             * @returns     void
             * @usage       This function will be called when user send message. This function then add message
             *              to message container and will push message to server.
             */
            sendMessage: function () {

                var message = this.chatBox.val();
                if (!message) return false;

                this.addMessage(message, 'self');
                this.pushMessage(message);

                this.chatBox.val('');
                this.chatBox.focus();
            },

            /**
             * @param       message {Text}
             * @param       socket  {object}
             * @returns     void
             * @usage       This function will push a user message to server
             */
            pushMessage: function (message, socket) {
                message = message;
                this.socket.emit('sendMessage', { message: message, sender: this.socket.io.engine.id });
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function scrolls chat container to the new added message (bottom)
             */
            scroller:function(){
                jQuery(document).scrollTop(jQuery(document).innerHeight());
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function is use to add welcome note to the chat
             */
            addWelcomeNote: function(){
                if(this.welcomeNote){
                    $(this.chatContainer).append($('<li class="dullmessage"><span>' + this.welcomeNote + '</span></li>'));
                }
            }
        }

        // extend default vaules
        var SDNodeChat = $.extend(_defaults, options);

        // remove trailing slash from URL using regular expression, if there any.
        SDNodeChat.server = SDNodeChat.server.replace(/\/$/, '');

        // create socket object
        if(SDNodeChat.server && SDNodeChat.port){
            //server + port
            SDNodeChat.socket = io(SDNodeChat.server + ':' + SDNodeChat.port);
        }else if(SDNodeChat.server && !SDNodeChat.port){
            // server + !port
            SDNodeChat.socket = io(SDNodeChat.server);
        }else{
            SDNodeChat.socket = io();
        }

        //if connected client is new, ask for intro
        SDNodeChat._intro();

        // Add welcome note
        SDNodeChat.addWelcomeNote();

        // Ask for online user-list every 3 min
        setInterval(function(){
            SDNodeChat.requestOnlineUsers();
        },10000);

        // Listen for online user list and show them in list
        SDNodeChat.receiveOnlineUsers();

        // listen for new messages over socket
        SDNodeChat.listenForMessages();

        // Bind click event to sendButton
        SDNodeChat.sendButton.click(function () {
            SDNodeChat.sendMessage(SDNodeChat);
        });

        // Bind chatbox to enter press if config set to truesendMessage
        if (SDNodeChat.enterToSend === true) {
            SDNodeChat.chatBox.bind('keypress', function (e) {
                // check if key is enter key
                if (e.keyCode == 13) {
                    SDNodeChat.sendMessage();
                }
            });
        }

        // Set focus to chatbox
        SDNodeChat.chatBox.focus();

        return SDNodeChat;
    };
    
}(window, document, jQuery));





