/**
 * @package      SD-NodeChat
 *
 * @author       Saurin Dashadia (SD) (http://saur.in)
 * @copyright    Copyright (C) 2014 Saurin Dashadia. All rights reserved.
 * @license      http://opensource.org/licenses/MIT, see LICENSE
 */

(function (window, document, $) {

    $.SDNodeChat = function (options) {

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
             * @default     null
             * @type        [object Socket]
             * @value       [object Socket]
             * @usage       This socket object will be use to communicate to server.
             */
            socket: null,

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
             * @default     "Welcome to SD-NodeChat! For more info visit <a href="https://github.com/devsaurin/SD-NodeChat">SD-NodeChat@GitHub</a>"
             * @type        [text]
             * @value       [text]
             * @usage       This is to welcome a new user. It will be ignored if value not present.
             */
            welcomeNote: "Welcome to SD-NodeChat! For more info visit <a href=\"https://github.com/devsaurin/SD-NodeChat\">SD-NodeChat@GitHub</a>",
        }

        // extend default vaules
        var SDNodeChatConf = $.extend(_defaults, options);

        // remove trailing slash from URL using regular expression, if there any.
        SDNodeChatConf.server = SDNodeChatConf.server.replace(/\/$/, '');

        return {
            /**
             *
             * @param       message {text}
             * @param       type    {text} ('self'/'other')
             * @returns     void
             * @usage       This function is use to display message.
             *              There are two ways to display messages
             *              1) type = 'self'    -> message from self
             *              2) type = 'other'   -> message from other users
             *              3) type = 'note'    -> Common notes to chat
             */
            addMsg : function (message, type) {
                var li = '<li class="' + type + '"><span>' + message + '</span></li>';
                $(SDNodeChatConf.chatContainer).append($(li));
                // scroll to new content
                this.scroll();
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function will be called when user send message. This function then add message
             *              to message container and will push message to server.
             */
            sendMsg: function () {

                var message = SDNodeChatConf.chatBox.val().trim();
                if (!message) return false;

                this.addMsg(message, 'self');
                this.pushMsg(message);

                SDNodeChatConf.chatBox.val('');
                SDNodeChatConf.chatBox.focus();
            },

            /**
             * @param       message {Text}
             * @param       socket  {object}
             * @returns     void
             * @usage       This function will push a user message to server
             */
            pushMsg: function (message) {
                SDNodeChatConf.socket.emit('newMsg', { message: message, username: SDNodeChatConf.username });
            },

            init : function(success, fail){
                var that = this;
                var _sdnc = SDNodeChatConf;

                var hostport = [];
                hostport.push( ((_sdnc.server)?_sdnc.server:null) );
                hostport.push( ((_sdnc.server && _sdnc.port)?_sdnc.port:null) );

                // initiate socket object
                _sdnc.socket = io(hostport.join(':'));

                //ask server to add this user.
                _sdnc.socket.emit('addUser', {username: _sdnc.username});
                _sdnc.socket.on('userAdded', function(data){
                    if(data.success === true){
                        // Add welcome note
                        if(_sdnc.welcomeNote){
                            that.addMsg(_sdnc.welcomeNote,'note');
                        }

                        // listen for new user joins
                        _sdnc.socket.on('newUser', function (data) {
                            that.addMsg(data.username + ' has joined chat.', 'note');
                        });

                        // listen for user left
                        _sdnc.socket.on('userLeft', function (data) {
                            that.addMsg(data.username + ' has left.', 'note');
                        });

                        // listen for new messages over socket
                        _sdnc.socket.on('newMsg', function (data) {
                            that.addMsg(data.username + ': ' +data.message, 'other');
                        });

                        // Bind click event to sendButton
                        _sdnc.sendButton.click(function () {
                            that.sendMsg();
                        });

                        // Bind chatbox to enter press if config set to truesendMessage
                        if (_sdnc.enterToSend === true) {
                            _sdnc.chatBox.bind('keypress', function (e) {
                                // check if key is enter key
                                if (e.keyCode == 13) {
                                    that.sendMsg();
                                }
                            });
                        }

                        // Set focus to chatbox
                        _sdnc.chatBox.focus();

                        // callback
                        success();
                    }else{
                        // callback
                        fail();
                    }
                });
            },

            /**
             * @param       SDNodeChatConf key
             * @returns     SDNodeChatConf value
             * @usage       This function is to get config value.
             */
            get: function(key){
                return SDNodeChatConf[key];
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function scrolls chat container to the new added message (bottom)
             */
            scroll:function(){
                jQuery(document).scrollTop(jQuery(document).innerHeight());
            },

            /**
             * @param       void
             * @returns     string
             * @usage       This function is to query clients basic info usually a name which can be use to identify
             *              user in chat room
             */
            logMessage: function(msg,isDebug){
                // Follow global debug flag if local flag not set.
                if(typeof isDebug === 'undefined') isDebug = SDNodeChatConf.debug;
                if(isDebug) console.log(msg);
            },

            /**
             * @param       void
             * @returns     void
             * @usage       This function is use to request list of online users
             */
            getUserList: function(){
                var that = this;
                SDNodeChatConf.socket.emit('userList');
                SDNodeChatConf.socket.on('userList', function (data) {
                    that.showUserList(data);
                });
            },

            /**
             * @param       data    {object}
             * @returns     void
             * @usage       This function is use to set friends list
             */
            showUserList:function(data){
                SDNodeChatConf.usersContainer.find('li').not('.caption').remove();
                var userList = JSON.parse(data);
                var userListHTML = '';
                for(u in userList){
                    userListHTML += '<li class="online">' + userList[u] + '</li>';
                }
                SDNodeChatConf.usersContainer.append($(userListHTML));
            }
        };
    };
    
}(window, document, jQuery));