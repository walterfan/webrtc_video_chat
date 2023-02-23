(function(WT){
    WT.getResolution = function () {
        let resolution = {};
        let size = document.getElementById('video_size');
        let value = size.options[size.selectedIndex].text
        switch (value) {
            case '90p':
                resolution.w = 160;
                resolution.h = 90;
                break;
            case '180p':
                resolution.w = 320;
                resolution.h = 180;
                break;
            case '240p':
                resolution.w = 352;
                resolution.h = 240;
                break;
            case '360p':
                resolution.w = 640;
                resolution.h = 360;
                break;
            case '720p':
                resolution.w = 1280;
                resolution.h = 720;
                break;
            case '1080p':
                resolution.w = 1920;
                resolution.h = 1080;
                break;
            case '2k':
                resolution.w = 3840;
                resolution.h = 2160;
                break;
            case '4k':
                resolution.w = 7680;
                resolution.h = 4320;
                break;
        }
        return resolution;
    };

    window.preConf = {
        loadType: 'separated',
        cachePage: true
    };



    // buttons
    WT.joinRoomButton = document.getElementById("joinRoom");
    WT.leaveRoomButton = document.getElementById("leaveRoom");

    WT.callButton = document.getElementById("call");
    WT.hungupButton = document.getElementById("hungup");

    WT.testConnectionButton = document.getElementById("testConnection");

    WT.startMediaButton = document.getElementById("startMedia");
    WT.stopMediaButton = document.getElementById("stopMedia");

    WT.displayStatsButton = document.getElementById("displayStats");
    WT.clearStatsButton = document.getElementById("clearStats");
    WT.displayLogButton = document.getElementById("displayLog");
    WT.clearLogButton = document.getElementById("clearLog");
    WT.sendMessageButton = document.getElementById("sendMsgBtn");
    WT.subscribeButton = document.getElementById("subscribeButton");

    WT.roomIdTxt = document.getElementById("roomId");
    WT.usernameTxt = document.getElementById("userName");
    WT.passwordTxt = document.getElementById("password");
    WT.emailTxt = document.getElementById("email");

    WT.configTxt = document.getElementById("cfgMessage");
    WT.recvMsgTxt = document.getElementById("recvMsgTxt");
    WT.sendMsgTxt = document.getElementById("sendMsgTxt");

    WT.attendeeCountLabel = document.getElementById("attendeeCount");

    WT.saveBtn = document.getElementById("savebtn");

    WT.displayStatsButton.addEventListener("click", e => displayDivOrNot(WT.displayStatsButton, document.getElementById("statsDiv"), e));
    WT.displayLogButton.addEventListener("click", e => displayDivOrNot(WT.displayLogButton, document.getElementById("logDiv"), e));


    WT.joinRoomButton.onclick = WT.room.joinRoom;
    WT.leaveRoomButton.onclick = WT.rtcClient.leaveRoom;

    WT.sendMessageButton.onclick = sendMsg;



    WT.callButton.onclick =  WT.call.startCall;
    WT.hungupButton.onclick =  WT.call.stopCall;

    WT.clearStatsButton.onclick =  clearStats;
    WT.clearLogButton.onclick =  clearLog;

    WT.startMediaButton.onclick =   WT.call.startMedia;
    WT.stopMediaButton.onclick = WT.call.stopMedia;

    WT.saveBtn.onclick = savePcConfig;

    WT.signalStateLabel = document.getElementById("signalstate");
    WT.iceConnectionsState = document.getElementById("iceconnectionstate");
    WT.muteAudioBtn = document.getElementById('muteAudioBtn');
    WT.muteVideoBtn = document.getElementById('muteVideoBtn');

    function muteAction(kind = 'audio') {
        if (!WT.call._pc) return;
        let button = 'audio' === kind ? WT.muteAudioBtn : WT.muteVideoBtn;
        switch (button.innerText) {
            case 'mute':
                mute(kind);
                button.innerText = 'unmute';
                break;
            case 'unmute':
                unmute(kind);
                button.innerText = 'mute';
                break;
        }
    }

    function mute(kind = 'audio') {
        WT.call._pc.getSenders().forEach((x) => {
            let track = x.track;
            if (track && track.kind === kind) {
                track.enabled = false;
            }
        })
    }

    function unmute(kind = 'audio') {
        WT.call._pc.getSenders().forEach((x) => {
            let track = x.track;
            if (track && track.kind === kind) {
                track.enabled = true;
            }
        })
    }

    function regexFilterHandler() {
        let regex = WT.regexFilter.value;
        [].forEach.call(document.getElementsByClassName('logs'), function (el) {
            let string = el.innerHTML;
            string = string.substring(string.match('<code>').index + 6);
            string = string.substring(0, string.match('</code>').index);
            if (new RegExp(regex, 'i').test(string)) {
                el.style.display = 'list-item';
            } else {
                el.style.display = 'none';
            }
        });
    } 


    function sendMsg() {
        var msg = WT.sendMsgTxt.value.trim();
        var sendMsgTransport = document.querySelector('input[name="messageTransport"]:checked').value;
        console.log("to send message", msg, " over ", sendMsgTransport);
        if(sendMsgTransport === "ws") {
            WT.rtcClient.sendWsMsg(msg);
        } else if (sendMsgTransport === "dc") {
            WT.call.sendDcMsg(msg);
        }

    }



    WT.showMessage = function(msg) {
        weblog("<---" + msg.replace(/\\r\\n/g, "<br />"));
        this.recvMsgTxt.innerHTML += "\n" + msg + "\n";
        this.recvMsgTxt.scrollTop = this.recvMsgTxt.scrollHeight - this.recvMsgTxt.clientHeight;
    }

    function displayDivOrNot(btnElement, divElement) {
        if(btnElement.innerText === "hide") {
            divElement.style.display = "none";
            btnElement.innerText = "display";
        } else {
            divElement.style.display = "block";
            btnElement.innerText = "hide";
        }
    }


    function savePcConfig(){
        localStorage.setItem("pc_config",JSON.stringify(cfgMsgElement.value,null,2));
    }

    function msgChange(checker, className) {
        [].forEach.call(document.getElementsByClassName(className), function (el) {
            if (checker.checked) {
                el.style.display = 'list-item';
            } else {
                el.style.display = 'none';
            }
        });
    }

    WT.enumerateDevices = function() {
        navigator.mediaDevices.enumerateDevices()
            .then(function(items){
                let mic_sel = document.getElementById('mic_sel');
                let cam_sel = document.getElementById('cam_sel');
                for (let key in items) {
                    let option = document.createElement("option");
                    option.value = items[key]["deviceId"];
                    option.text = items[key]["label"];
                    if(items[key]["kind"] === "audioinput") {
                        mic_sel.add(option);
                    } else if (items[key]["kind"] === "videoinput") {
                        cam_sel.add(option);
                    }
                }
            })
    }
}(WT ||{}));
