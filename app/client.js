(function(WT, $) {
    "use strict";

    WT = WT || {};


    function RtcClient() {
        this.m_roomConnection = null;
        this.m_edgeConnection = null;
        this.connected = false;


    }

    $.extend(RtcClient.prototype, {

        joinRoom: function(roomUrl, msgCb, successCb, failCb) {
            console.log("joinRoom", roomUrl);
            var self = this;

            this.m_roomConnection = this.m_roomConnection || new WebSocket(roomUrl);
            this.m_roomConnection.onopen = function(ev) {
                self.connected = true;
                weblog("[connection opened]");

                $("#joinRoom").attr('disabled', true);
                $("#leaveRoom").attr('disabled', false);
                successCb && successCb(ev);
            };
            this.m_roomConnection.onclose = function(ev) {
                self.connected = false;
                weblog("[connection closed]");
                self.m_roomConnection = null;
            };
            this.m_roomConnection.onmessage = function(ev) {
                console.debug("onmessage: " + ev.data);
                msgCb && msgCb(ev.data);
            };
            this.m_roomConnection.onerror = function(ev) {
                weblog("[error]");
                console.log(ev);
                failCb && failCb(ev);
            };


        },

        leaveRoom: function() {
          console.log("leaveRoom");

          $("#joinRoom").attr('disabled', false);
          $("#leaveRoom").attr('disabled', true);

          WT.rtcClient.m_roomConnection.close();

        },


        sendWsMsg: function(msg) {
          if(!msg) {
            console.error("msg is ", msg);
            return;
          }
          var strMsg = JSON.stringify(msg);
          weblog("WS --> send: " + strMsg);
          if(this.connected) {
            this.m_roomConnection.send(strMsg);
          } else {
            console.error("websocket is not connected");
          }

        },

        httpPost: function(url, headers, body, successCb, failCb) {


                $.ajax({
                   type: "POST",
                   url: url,
                   headers: headers,
                   data: body,
                   contentType: "application/json; charset=utf-8",
                   dataType: "json",
                   success: function(data) {
                       console.debug("sent successfully: ", data);
                       successCb && successCb(data);
                   },
                   error: function() {
                       console.debug("sent failed: ");
                       failCb && failCb("post error to " + url);
                   }
                });


        }


    });

    WT.rtcClient = WT.rtcClient || new RtcClient();

    return WT.rtcClient;
}(WT, jQuery));