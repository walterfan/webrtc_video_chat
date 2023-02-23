
function weblog() {
    
    var arrMsg = [];
    for (var i = 0; i < arguments.length; i++) {
        var argVar = arguments[i];
        if(typeof argVar === 'object' && argVar !== null) {
            arrMsg.push(JSON.stringify(argVar, null, 2));
        } else {
            arrMsg.push(argVar);
        }

    }

    let message = arrMsg.join(' ');
    console.log(message);
    let logContent = document.getElementById('logContent');
    let elem = document.createElement("li");
    elem.classList.add('logs');

    elem.innerHTML = "[" + (performance.now() / 1000).toFixed(3) + "] <code>" + message + "</code>";
    logContent.appendChild(elem);
}

function updateWebStats(msg, eleId) {

    let subContent = document.getElementById(eleId);
    if (subContent === null){
        
        let content = document.getElementById('statsContent');
        subContent = document.createElement("li");
        subContent.classList.add('statsItem');
        subContent.id = eleId;
        subContent.innerHTML = msg;
        content.appendChild(subContent);
    }
    else {
        subContent.innerHTML = msg;
    }
}

function listUserDevices() {
   if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
     weblog("enumerateDevices() not supported.");
     return;
   }

   // List cameras and microphones.
   navigator.mediaDevices.enumerateDevices()
       .then(function(devices) {
            var i = 0;
            devices.forEach(function(device) {
               var msg  = (++i) + ". device kind=" + device.kind + ", label=" + device.label + ", id=" + device.deviceId;
               weblog(msg);
         });
       })
       .catch(function(err) {
           var errMsg = err.name + ": " + err.message
           weblog(errMsg);
       });
}

function getSupportConstraints() {
   let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

   for (let constraint in supportedConstraints) {
     if (supportedConstraints.hasOwnProperty(constraint)) {
       weblog("<code>" + constraint + "</code>");

     }
   }
}

function getUserDevice(cbStream, cbError) {
   if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
      weblog("navigator.mediaDevices not defined");
   }

   const constraints = {
       'video': true,
       'audio': true
   }

   navigator.mediaDevices.getUserMedia(constraints)
       .then(stream => {
           weblog("Got MediaStream " + stream);
           cbStream(streeam)
       })
       .catch(error => {
           weblog("Got MediaStream " + ": " + error.name + ",  " + error.message);
           cbError(error)
       });

}

async function getConnectedDevices(type) {
   const devices = await navigator.mediaDevices.enumerateDevices();
   return devices.filter(device => device.kind === type)
}


async function createOffer(offerOptions) {
    try {
        const offer = await peerConnection.createOffer(offerOptions);
        await peerConnection.setLocalDescription(offer);
        console.log(offer.sdp);
        return offer;
      } catch (e) {
        console.log(`Failed to create offer: ${e}`);
        return null;
      }
}

function getBrowserName(brownserInfo) {
  /* jshint maxcomplexity: 16 */
  //var nVer = navigator.appVersion;
  var nAgt = navigator.userAgent;
  var browserName = navigator.appName;
  var fullVersion = '' + parseFloat(navigator.appVersion);
  var majorVersion = parseInt(navigator.appVersion, 10);
  var nameOffset, verOffset, ix;

  // In Opera 15+, the true version is after "OPR/"
  if ((verOffset = nAgt.indexOf("OPR/")) !== -1) {
      browserName = "Opera";
      fullVersion = nAgt.substring(verOffset + 4);
1
      // In older Opera, the true version is after "Opera" or after "Version"
  } else if ((verOffset = nAgt.indexOf("Opera")) !== -1) {
      browserName = "Opera";
      fullVersion = nAgt.substring(verOffset + 6);
      if ((verOffset = nAgt.indexOf("Version")) !== -1) {
          fullVersion = nAgt.substring(verOffset + 8);
      }

      // In MSIE, the true version is after "MSIE" in userAgent
  } else if ((verOffset = nAgt.indexOf("MSIE")) !== -1) {
      browserName = "IE";
      fullVersion = nAgt.substring(verOffset + 5);

      // In Chrome, the true version is after "Chrome"
  } else if ((verOffset = nAgt.indexOf("Chrome")) !== -1) {
      browserName = "Chrome";
      fullVersion = nAgt.substring(verOffset + 7);
      if (nAgt.indexOf("CrOS") >= 0) {
          browserName = "Chromebook";
      }

      // In Safari, the true version is after "Safari" or after "Version"
  } else if ((verOffset = nAgt.indexOf("Safari")) !== -1) {
      browserName = "Safari";
      fullVersion = nAgt.substring(verOffset + 7);
      if ((verOffset = nAgt.indexOf("Version")) !== -1) {
          fullVersion = nAgt.substring(verOffset + 8);
      }

      // In Firefox, the true version is after "Firefox"
  } else if ((verOffset = nAgt.indexOf("Firefox")) !== -1) {
      browserName = "Firefox";
      fullVersion = nAgt.substring(verOffset + 8);

      // In most other browsers, "name/version" is at the end of userAgent
  } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
      (verOffset = nAgt.lastIndexOf('/'))) {
      browserName = nAgt.substring(nameOffset, verOffset);
      fullVersion = nAgt.substring(verOffset + 1);
      if (browserName.toLowerCase() === browserName.toUpperCase()) {
          browserName = navigator.appName;
      }
  }

  // trim the fullVersion string at semicolon/space if present
  if ((ix = fullVersion.indexOf(";")) !== -1) {
      fullVersion = fullVersion.substring(0, ix);
  }
  if ((ix = fullVersion.indexOf(" ")) !== -1) {
      fullVersion = fullVersion.substring(0, ix);
  }
  majorVersion = parseInt('' + fullVersion, 10);
  if (isNaN(majorVersion)) {
      fullVersion = '' + parseFloat(navigator.appVersion);
      majorVersion = parseInt(navigator.appVersion, 10);
  }

  //  check if we get the browser info right
  if (isNaN(majorVersion)) {
      this._trace.error("_getDefaultbrownserInfo: failed to get browser information");
      return null;
  }

  brownserInfo.browserName = browserName;
  brownserInfo.browserFullVer = fullVersion;
  brownserInfo.browserMajorVersion = majorVersion;
  console.log("browserName=", browserName,
      "browserFullVer=", fullVersion,
      "majorVersion=", majorVersion);
}

function getBrowserName(){
    var ua = navigator.userAgent;
    var tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])){
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { 'browser': 'IE', 'version': tem[1] || '' };
    }
    if (M[1] === 'Chrome'){
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem != null) {
            return { 'browser': tem[1].replace('OPR', 'Opera'), 'version': tem[2] };
        }
        if (ua.indexOf("CrOS") >= 0) {
            M[1] = "Chromebook";
        }
    }
    M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if ((tem= ua.match(/version\/(\d+)/i))!== null) {
        M.splice(1, 1, tem[1]);
    }
    return { 'browser': M[0], 'version': M[1] };
}

createVideoElement = function(elementId, parentId, width) {
    
    var element = window.document.createElement('video');
    element.id = elementId;
    element.width = width || 480;
    element.autoplay = true;
    element.setAttribute('controls', true);

    var container = document.getElementById(parentId);
    container.appendChild(element);
    return element;
}

attachMediaStream = function(element, stream) {
    console.log("Attaching media stream to ", element);

    element.srcObject = stream;
    element.play();
    return element;
}

parseSDP = function(sdp) {
    arrayOfLines = sdp.match(/[^\r\n]+/g);
    return arrayOfLines.join("<br/>");
}


function setPixel(imageData, x, y, r, g, b, a){

    var index = (x + y * imageData.width);
    imageData.data[index * 4 + 0] = r;
    imageData.data[index * 4 + 1] = g;
    imageData.data[index * 4 + 2] = b;
    imageData.data[index * 4 + 3] = a;
}

function getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
}

function getUuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

async function postData(url, data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}


function readIceUfragAndPwd(sdp) {
    const ICE_UFRAG = "a=ice-ufrag:";
    const ICE_PWD = "a=ice-pwd:";
    var lines = sdp.split("\r\n")
    var dictAttr = {};
    for(var line of lines) {

      var pos0 = line.indexOf(ICE_UFRAG);
      if(pos0 >= 0) {
          //console.log(line);
          dictAttr["iceUfragAttr"] = line;
      }
      var pos1 = line.indexOf(ICE_PWD);
      if(pos1 >= 0) {
          dictAttr["icePwdAttr"] = line;
      }

      if(dictAttr["iceUfragAttr"] && dictAttr["icePwdAttr"]) {
          break;
      }
    }

    return dictAttr;
  }




/**
 * add media attributes after a=mid:..
 * @param {*} sdp the input SDP
 * @param {*} audio_attributes the attributes need end with \r\n
 * @param {*} video_attributes the attributes need end with \r\n
 * @param {*} app_attributes the attributes need end with \r\n
 * @returns 
 */
 function add_media_attributes(sdp, audio_attributes, video_attributes, app_attributes) {

    var changed_sdp = "";
    var sdps = sdp.split(/(a=mid:.*\s+)/);

    changed_sdp = sdps[0];
    for (var i=1;i < sdps.length; i++) {

        var videoMLinePos = sdps[i-1].search(/(m=video.*\s+)/);
        var audioMLinePos = sdps[i-1].search(/(m=audio.*\s+)/);
        var appMLinePos = sdps[i-1].search(/(m=application.*\s+)/);

        //console.log(i, "audioMLinePos=", audioMLinePos, ", videoMLinePos=", videoMLinePos,  " : ", sdps[i]);
        changed_sdp += sdps[i];
        if(video_attributes && videoMLinePos > 0 && sdps[i].startsWith("a=mid:")) {
            changed_sdp += video_attributes;
        }
        if(audio_attributes && audioMLinePos > 0 && sdps[i].startsWith("a=mid:")) {
            changed_sdp += audio_attributes;
        }
        if(app_attributes && appMLinePos > 0 && sdps[i].startsWith("a=mid:")) {
            changed_sdp += app_attributes;
        }
    }

    return changed_sdp;
}

function renderRoster(rosterMessage) {
    WT.attendeeCountLabel.innerHTML = WT.room._participant_count;
}

function clearLog() {
    console.log("clear logs...");
    let div = document.getElementById("logContent");
    while(div.hasChildNodes()) {
        div.removeChild(div.firstChild);
    }
}