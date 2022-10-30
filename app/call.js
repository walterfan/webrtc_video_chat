(function(WT, $) {
    "use strict";

    WT = WT || {};
    var call = WT.call = WT.call || {
        _pc: null,

        sendrecv_audio_mid: null,
        sendrecv_video_mid: null,

        _local_dc: null, //data channel
        _remote_dc: null,

        _role: null, //offerer, answerer
        _pc_config:  {"bundlePolicy":"balanced","iceCandidatePoolSize":3 },
        _sdpConstraints: {
            'offerToReceiveAudio':true,
            'offerToReceiveVideo':true },

        _isStarted: false,

        _local_stream: null,
        _local_video_element: null,

        _local_ice_attrs_local_ice_attrs: null,
        _local_candidate_gather_done: false,

        _remote_stream: null,
        _remote_video_element: null,

        _local_sdp: null,
        _local_candidates:[],

        _remote_sdp: null,
        _remote_candidates: [],

        _msg_seq_num: 0,
        _statsTimerId: 0,
        _historyStats: {}

    };

    $.extend(call, {
        startCall: async function() {
            console.log("startCall...");
            var ice_server = {'url': WT.room._configuration["ice_server_url"]};

            WT.room._configuration["ice_server_url"] && (ice_server['url'] =  WT.room._configuration["ice_server_url"]);
            WT.call._pc_config["iceServers"] = [ice_server];

            var pc = WT.call._pc = WT.call._pc || WT.call.createPeerConnection(WT.call._pc_config);

            var local_stream = WT.call._local_stream;

            if(local_stream) {
                for(const audioTrack of local_stream.getAudioTracks()) {
                    pc.addTransceiver(audioTrack, {direction:  'sendonly', streams: [local_stream]});
                }

                var encodings = [
                    {rid: 'high', maxBitrate: 2500000, active: true},
                    {rid: 'middle', maxBitrate: 1500000, active: true, scaleResolutionDownBy: 2.0},
                    {rid: 'low', maxBitrate: 800000, active: true, scaleResolutionDownBy: 4.0}
                ];

                for(const videoTrack of local_stream.getVideoTracks()) {
                    if (document.getElementById('simulcast').checked) {
                        pc.addTransceiver(videoTrack, {direction:  'sendonly', sendEncodings: encodings, streams: [local_stream]});
                    } else {
                        pc.addTransceiver(videoTrack, {direction:  'sendonly', streams: [local_stream]});
                    }
                }
            }


            pc.addTransceiver('audio', {direction:  'recvonly'});
            pc.addTransceiver('video', {direction:  'recvonly'});


            var state = pc.signalingState;
            weblog("participant count: " + WT.room.getParticipantCount(), ", isHost: ",  WT.room.isHost(),
            ", signalState:", state);

            if(WT.call._remote_sdp) {
                console.log("startCall...onRemoteSdp...state=", state);
                WT.call.onRemoteSdp(WT.call._remote_sdp);
            } else {
                if(!state || state == "stable") {
                    console.log("create offer from ", state);
                    pc.createOffer(WT.call.onLocalSdp, WT.call.onSdpError, WT.call._sdpConstraints);
                } else if(state === "have-remote-offer" || state === "have-local-pranswer") {
                    console.log("create answer from ", state);
                    pc.createAnswer(WT.call.onLocalSdp, WT.call.onSdpError, WT.call._sdpConstraints);
                }
            }

            for(const candidate of WT.call._remote_candidates) {
                pc.addIceCandidate(candidate);
            }

        },

        stopCall: function() {
            console.log("stopCall...");
            var pc = WT.call._pc;
            if (pc) pc.close();
            pc = null;
            var cmd = { type: "bye", data: "hungup"};
            WT.rtcClient.sendWsMsg(cmd);

        },

        changeSdp: function(sdp) {
            //TODO: use H.264 and disable TWCC for now
            return sdp;
        },

        onLocalSdp: async function(sessionDescription) {
            console.log("onLocalSdp: ", sessionDescription);
            WT.call._local_sdp = sessionDescription;

            sessionDescription.sdp = WT.call.changeSdp(sessionDescription.sdp);
            try {
                await WT.call._pc.setLocalDescription(sessionDescription);
            } catch(err) {
                console.error("setLocalDescription error ", err);
            }

            if("p2p" == WT.call.getTopology()) {
                WT.rtcClient.sendWsMsg(sessionDescription);
            } else {

                if(WT.call._local_candidate_gather_done /*|| WT.call._local_candidates.length > 0*/) {
                      WT.call.createConfluence();
                } else {
                    WT.call.waitForCandidateGathering();
                }
            }


        },

        waitForCandidateGathering: function() {
            console.log("waitForCandidateGathering ...");
            if(WT.call._local_candidate_gather_done /*|| WT.call._local_candidates.length > 0 */)
            {
                WT.call._pc.createOffer(WT.call.onLocalSdp, WT.call.onSdpError, WT.call._sdpConstraints);
                return;
            }
            setTimeout(WT.call.waitForCandidateGathering, 500);//wait 500 millisecnds then recheck
        },

        onRemoteSdp: async function(sessionDescription) {
            console.log("onRemoteSdp: ", sessionDescription);
            WT.call._remote_sdp = sessionDescription;

            var pc = WT.call._pc;

            if(pc) {
                try {
                    await pc.setRemoteDescription(sessionDescription);

                    if(/offer/i.test(sessionDescription.type)) {
                        pc.createAnswer(WT.call.onLocalSdp, WT.call.onSdpError);
                    }
                } catch(err) {
                    console.error("setRemoteDescription error ", err);
                }

            } else {
                weblog("startCall from remote offer");
                WT.call.startCall();
            }

        },

        onSdpError: function(event) {
            console.log("onSdpError: ", event);

        },

        onRemoteMessage: function(message) {
            console.log("Got call's onRemoteMessage", message);
            var pc = WT.call._pc;

            if (message.type === 'offer') {
                var sdpOffer = new RTCSessionDescription(message);
                WT.call.onRemoteSdp(sdpOffer);

              } else if (message.type === 'answer') {
                  var sdpAnswer = new RTCSessionDescription(message);
                  WT.call.onRemoteSdp(sdpAnswer);

              } else if (message.type === 'candidate') {
                var candidate = new RTCIceCandidate({sdpMLineIndex:message.label, candidate:message.candidate});
                WT.call._remote_candidates.push(candidate);
                try {
                  pc && pc.addIceCandidate(candidate);
                } catch(err) {
                  console.error("addIceCandidate error, candidate=", candidate, "err=", err);
                }

              } else {
                 console.warn("unknown message type");
              }
        },

        buildGdmOptions: function(selectedMediaFamilies, w, h, fRate) {
            let gdmOptions = {};
            if (selectedMediaFamilies.sharingAudio) {
                gdmOptions['audio'] =  {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                };
            }

            if (selectedMediaFamilies.sharingVideo) {
                gdmOptions['video'] ={
                    width: {
                        max: w
                    },
                    height: {
                        max: h
                    }
                };
            }
            return gdmOptions;
        },
        buildGumOptions: function (selectedMediaFamilies, w, h, fRate) {
            let gumOptions = {};
            if (selectedMediaFamilies.mainAudio) {
                gumOptions['audio'] =  {
                    deviceId: document.getElementById('mic_sel').value,
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                };
            }

            if (selectedMediaFamilies.mainVideo) {
                gumOptions['video'] ={
                    deviceId: document.getElementById('cam_sel').value,
                    width: {
                        max: w
                    },
                    height: {
                        max: h
                    }
                };
            }
            return gumOptions;
        },
        captureMicOrCamera: async function(selectedMediaFamilies) {
            let captureStream;
            let resolution = WT.getResolution();
            let frameRate = +document.getElementById('frame_rate').value;

            let gumOptions = WT.call.buildGumOptions(selectedMediaFamilies, resolution.w, resolution.h, frameRate);
            console.log("gumOptions: ", gumOptions);
            try {
                captureStream = await navigator.mediaDevices.getUserMedia(gumOptions);

                WT.call.handleUserMedia(captureStream);

                if (WT.call._pc) {
                    for(const audioTrack of captureStream.getAudioTracks()) {
                        WT.call._pc.getSenders()[0].replaceTrack(audioTrack);
                    }
                    for(const videoTrack of captureStream.getVideoTracks()) {
                        WT.call._pc.getSenders()[1].replaceTrack(videoTrack);
                    }
                }
              } catch (ex) {
                console.error("handleUserMedia ", ex);
                WT.call.handleUserMediaError(ex);
            }
            return captureStream;
        },

        captureScreen: async function(selectedMediaFamilies) {
            let captureStream;
            let resolution = WT.getResolution();
            let frameRate = +document.getElementById('frame_rate').value;

            let gdmOptions = WT.call.buildGdmOptions(selectedMediaFamilies, resolution.w, resolution.h, frameRate);
            console.log("gdmOptions: ", gdmOptions);
            try {
                captureStream = await navigator.mediaDevices.getDisplayMedia(gdmOptions);

                WT.call.handleUserMedia(captureStream);

                if (WT.call._pc) {
                    for(const audioTrack of captureStream.getAudioTracks()) {
                        WT.call._pc.getSenders()[0].replaceTrack(audioTrack);
                    }
                    for(const videoTrack of captureStream.getVideoTracks()) {
                        WT.call._pc.getSenders()[1].replaceTrack(videoTrack);
                    }
                }
              } catch (ex) {
                console.error("handleUserMedia ", ex);
                WT.call.handleUserMediaError(ex);
            }
            return captureStream;
        },
        startMedia: async function() {
            console.log("startMedia...");

            let selectedMediaFamilies = {
                "mainAudio": document.getElementById('mainAudio').checked,
                "mainVideo": document.getElementById('mainVideo').checked,
                "sharingAudio": document.getElementById('sharingAudio').checked,
                "sharingVideo": document.getElementById('sharingVideo').checked
            };

            if (selectedMediaFamilies.mainAudio || selectedMediaFamilies.mainVideo) {
                WT.call.captureMicOrCamera(selectedMediaFamilies);
            }
            if (selectedMediaFamilies.sharingAudio || selectedMediaFamilies.sharingVideo) {
                WT.call.captureScreen(selectedMediaFamilies);
            }
        },

        stopMedia: function() {

            if(!WT.call._local_video_element) return;
            let tracks = WT.call._local_video_element.srcObject.getTracks();

            tracks.forEach(track => track.stop());
            WT.call._local_video_element.srcObject = null;
            $("#localVideo").remove();

        },

        handleUserMedia: function(stream) {
            console.log("handleUserMedia...", stream);
            WT.call._local_stream = stream;
            WT.call._local_video_element = createVideoElement("localVideo", "selfVideo");

            $("#selfVideoPos").show();
            attachMediaStream(WT.call._local_video_element, stream);
        },

        handleUserMediaError: function(err) {
            console.error("handleUserMediaError...", err);
        },

        createPeerConnection: function() {
            console.log("createPeerConnection...");
            // {'url':'stun:stun.qq.com:3478'}
            var pc = null;
            try {
              pc = new RTCPeerConnection(WT.call._pc_config);
              pc.onicecandidate = WT.call.handleIceCandidate;
              pc.onaddstream = WT.call.handleRemoteStreamAdded;
              pc.ontrack = WT.call.handleTrackAdded;
              pc.onremovestream = WT.call.handleRemoteStreamRemoved;
              pc.oniceconnectionstatechange = WT.call.onIceConnectionChange;
              pc.onicegatheringstatechange = WT.call.onIceGatheringStateChange;

              pc.addEventListener("signalingstatechange", event => {
                var sigState = event.target.signalingState;
                var iceState = event.target.iceConnectionState;
                var iceGathState = event.target.iceGatheringState;
                WT.signalStateLabel.innerText = "Signal State: " + event.target.signalingState || "not negotiated";
                weblog("signalingState=", sigState, ", iceConnectionState=", iceState, ", iceGathState=", iceGathState);
              });

              weblog('Created RTCPeerConnnection with config: \'' + JSON.stringify(WT.call._pc_config) + '\'\n');

              WT.call.createDatachannel(pc);

            } catch (e) {
              weblog('Failed to create PeerConnection, exception: ' + e.message);
              alert('Cannot create RTCPeerConnection object.');
                return;
            }

            return pc;
        },

        getMsgSeqNum: function() {
            let seqNum = WT.call._msg_seq_num || 0;
            WT.call._msg_seq_num = ++seqNum;
            return seqNum;
        },

        sendDcMsg: function(msg) {
            if (!WT.call._local_dc || !'open' === WT.call._local_dc.readyState) {
                console.error('dc is not ready!')
                console.log(WT.call._local_dc)
                return;
            }
            if (!msg) {
                console.error('msg is ' + msg)
                return;
            }
            weblog("DC --> send: " + msg);
            WT.call._local_dc.send(msg)
        },

        createDatachannel: function(pc) {
            console.log("createDatachannel...");

            var channel = WT.call._local_dc = pc.createDataChannel("chat");

            channel.onopen = function(event) {

                var msg = {"type": "message", "data": "welcome"};
                channel.send(JSON.stringify(msg));
            }
            channel.onmessage = function(event) {
                let msg = event.data;
                weblog("datachannel onmessage ", msg);
                WT.showMessage(msg);

            }

            channel.onclose = function(event) {
                weblog("datachannel onclose ", event);
            }

            channel.onerror = function(event) {
                weblog("datachannel onerror ", event);
            }

            pc.ondatachannel = function(event) {
                var remote_channel = WT.call._remote_dc = event.channel;
                remote_channel.onopen = function(event) {
                    weblog("datachannel onopen ", event);
                }
                remote_channel.onmessage = function(event) {
                    weblog("remote_channel got ", event.data);
                    WT.showMessage(event.data);

                }
                remote_channel.onclose = function(event) {
                    weblog("remote_channel onclose ", event);
                }
    
                remote_channel.onerror = function(event) {
                    weblog("remote_channel onerror ", event);
                }
            }
        },



        handleIceCandidate: function(event) {
            weblog('handleIceCandidate event: ' + JSON.stringify( event));
            if (event.candidate) {
                WT.call._local_candidates.push(event.candidate);
                if("p2p" == WT.call.getTopology()) {
                    WT.rtcClient.sendWsMsg({
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate});
                }
            } else {
              weblog('End of candidates.');
              WT.call._local_candidate_gather_done = true;
            }
        },
        handleRemoteStreamAdded: function(event) {
            console.log("handleRemoteStreamAdded...", event);
            //TODO: add more streams
            WT.call._remote_stream = event.stream;
            $("#liveVideoPos").show();
            WT.call._remote_video_element = createVideoElement("remoteVideo", "liveVideo");
            attachMediaStream(WT.call._remote_video_element, WT.call._remote_stream);
        },

        handleTrackAdded: function(event) {
            console.log('handleTrackAdded...', event);
            if ('sendrecv' === event.transceiver.direction) {
                if ('audio' === event.track.kind) {
                    WT.call.sendrecv_audio_mid = event.transceiver.mid;
                } else if ('video' === event.track.kind) {
                    WT.call.sendrecv_video_mid = event.transceiver.mid;
                }
            }
        },
        handleRemoteStreamRemoved: function(event) {
            console.log("handleRemoteStreamRemoved...", event);
        },
        onIceConnectionChange: function(event) {
            WT.iceConnectionsState.innerText = "IceConnection State: " + event.target.iceConnectionState || "not connected";
            console.log("onIceConnectionChange...", event);

            mayStartStatsTimer(event);
        },

        onIceGatheringStateChange: function(event) {
            console.log("onIceGatheringStateChange...", event);
        },
        getTopology: function() {
            return document.querySelector('input[name="topology"]:checked').value;
        },
    });


    return WT;
}(WT, jQuery));