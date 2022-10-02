(function(WT, $) {
    "use strict";

    WT = WT || {};

    var room = WT.room = WT.room || {
        _participant_count: 0,
        _is_host: false,
        _configuration:  null,
        _commands: [
            "echo",
            "floor",
            "join",
            "leave",
            "offer",
            "answer",

            "candidate"
        ]
    };
    $.extend(room, {
        getParticipantCount: function() {
            return this._participant_count;
        },

        isHost: function() {
            return this._is_host;
        },

        joinRoom: function() {

            var cfgObj = WT.room._configuration =  JSON.parse(WT.configTxt.value);

            var roomUrl = cfgObj.room_url;
            var roomId = WT.roomIdTxt.value;

            roomUrl = roomUrl + "/echo?r=" + roomId;

            WT.rtcClient.joinRoom(roomUrl, WT.room.onRoomMessag);
        },

        onRoomMessag: function(msg) {
            WT.showMessage(msg);

            var objMsg = JSON.parse(msg);
            if(!objMsg) {
                console.log("cannot parse", msg);
                return;
            }

            if(objMsg.type === 'join') {
                WT.room._participant_count = objMsg.count;
                renderRoster();

                if(objMsg.count === 1) {
                    WT.room._is_host = true;


                } else {
                    weblog("I'm not host, wait roster syncup");
                }
            } else if(/offer|answer|candidate/.test(objMsg.type)) {
                WT.call.onRemoteMessage(objMsg);

            } else if ('leave' === (objMsg.type) ) {
                let leaveUser = objMsg.data.username;
                
                renderRoster();
            } else {
                weblog("unknown " + msg);
            }
        },
        //join, leave, echo, floor, offer, answer
        sendCommand: function(type, data) {
            var command = {
                type: type,
                data: data
            };
            WT.rtcClient.sendWsMsg(command);
        }

    });


    return WT;
}(WT, jQuery));