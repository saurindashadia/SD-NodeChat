/**
 * @package      SD-NodeChat
 *
 * @author       Saurin Dashadia (SD) (http://saur.in)
 * @copyright    Copyright (C) 2014 Saurin Dashadia. All rights reserved.
 * @license      http://opensource.org/licenses/MIT, see LICENSE
 */

(function ($) {
    $.initSDNodeChat = function (options) {
        // set default options.
        //noinspection JSValidateTypes
        var SDNodeChatConf = $.extend({

            // Server ip/domain where chat resides, this should match the value from the config file.
            server: "http://localhost",

            // Port number to listen for communication, this should match value from the config file.
            port: "80",

            // Chat container UL/OL
            chatContainer: $('#messages'),

            // Id of the send button, this will be use bind sending action to this button.
            sendButton: $('#SendButtonID'),

            // Id of the textbox, this will be use to bind sending action to this text.
            chatBox: $('#chatTextBoxId'),

            // Enable or disable enter key as sender on chatBox
            enterToSend: true,

            // Socket object
            socket: null,

            // Basic function to call on user action to send message.
            // this will calll function to add message to chat container as well as
            // will call function to push message to server
            sendMessage: function () {
                var message = this.chatBox.val();
                if (!message) return false;

                this.addMessage(message, 'self');
                this.pushMessage(message);

                this.chatBox.val('');
                this.chatBox.focus();
            },

            // Add message to message container
            addMessage: function (message, type) {
                var li = '<li class="' + type + '"><span>' + message + '</span></li>';
                $(this.chatContainer).append($(li));
                $('#messages').scrollTop($('#messages').height());
            },

            // push message to server
            pushMessage: function (message, socket) {
                message = message;
                this.socket.emit('sendmessage', { message: message, sender: this.socket.io.engine.id });
            },

            listenForMessage: function () {
                var that = this;
                that.socket.on('getmessage', function (data) {
                    if (data.sender != this.io.engine.id) {
                        that.addMessage(data.message, 'other');
                    }
                });
            },

            intro: function () {
                var that = this;
                that.socket.on('getIntro', function (data) {
                    var clientName = prompt('Please intro yourself to chatroom!', 'anonymous');
                    that.socket.emit('setIntro', {name: clientName});
                })
                // request friendlist for first time
                this.requestFriendList();
            },

            requestFriendList: function(){
                var that = this;
                that.socket.emit('requestFriendList');
            },

            receiveFriendList: function () {
                var that = this;
                that.socket.on('receiveFriendList', function (data) {
                    var friends = JSON.parse(data);
                    $('#friendlist li').not('.caption').remove();
                    for(f in friends){
                        $('#friendlist').append($('<li class="online">' + friends[f] + '</li>'));
                    }
                });
            }

        }, options);

        // remove trailing slash from URL if ther any using regular expression
        SDNodeChatConf.server = SDNodeChatConf.server.replace(/\/$/, '');

        // create socket object
        SDNodeChatConf.socket = io(SDNodeChatConf.server + ':' + SDNodeChatConf.port);

        //if connected client is new ask for intro
        SDNodeChatConf.intro();

        // Ask for friedlist every 3 min
        setInterval(function(){
            SDNodeChatConf.requestFriendList();
        },10000);


        // Listen for friend list and show them in list
        SDNodeChatConf.receiveFriendList();

        // listen for new messages over socket
        SDNodeChatConf.listenForMessage();

        // Bind click event to sendButton
        SDNodeChatConf.sendButton.click(function () {
            SDNodeChatConf.sendMessage(SDNodeChatConf);
        });

        // Bind chatbox to enter press if config set to truesendMessage
        if (SDNodeChatConf.enterToSend === true) {
            SDNodeChatConf.chatBox.bind('keypress', function (e) {
                // check if key is enter key
                if (e.keyCode == 13) {
                    SDNodeChatConf.sendMessage();
                }
            });
        }

        // Set focus to chatbox
        SDNodeChatConf.chatBox.focus();

        return SDNodeChatConf;
    };
}(jQuery));





