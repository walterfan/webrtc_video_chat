
function displayStatistics(peerStats) {

    let statsOutput = "";
    var histroyStats = WT.call._historyStats;

    if (!histroyStats || !peerStats.ssrc) { return; }

    // use type and ssrc to distinguish, because different type has different statistic value and same ssrc has different type
    var typeStatsObj = histroyStats[peerStats.type] = histroyStats[peerStats.type] || {};
    var preStats = typeStatsObj[peerStats.ssrc] = typeStatsObj[peerStats.ssrc] || {};

    // display statistics
    statsOutput = `<hr/><h5>Report: ${peerStats.type}</h5>\n` +
        `<strong>ID:</strong> ${peerStats.id}<br>\n` +
        `<strong>Timestamp:</strong> ${peerStats.timestamp}<br>\n` +
        `<strong>ssrc:</strong> ${peerStats.ssrc}<br>\n` +
        `<strong>kind:</strong> ${peerStats.kind}<br>\n`;

    if (peerStats.type === "inbound-rtp") {
        statsOutput += `<strong>jitter:</strong> ${peerStats.jitter}<br>\n`;
        statsOutput += `<strong>totalPacketsLost:</strong> ${peerStats.packetsLost}<br>\n`;
        statsOutput += `<strong>packetsLost(5s):</strong> ${peerStats.packetsLost-(preStats.packetsLost || 0)}<br>\n`;
        statsOutput += `<strong>packetsReceived:</strong> ${peerStats.packetsReceived}<br>\n`;

        // unit bit/s
        let rcvRate = ((peerStats.bytesReceived - (preStats.bytesReceived || 0)) * 8) / 5;
        statsOutput += `<strong>bytesReceived:</strong> ${peerStats.bytesReceived}<br>\n`;
        statsOutput += `<strong>rcvRate(bps):</strong> ${rcvRate}<br>\n`;

        if (peerStats.kind === "audio") {
            statsOutput += `<strong>packetsDiscarded:</strong> ${peerStats.packetsDiscarded}<br>\n`;
            statsOutput += `<strong>audioLevel:</strong> ${peerStats.audioLevel}<br>\n`;

        } else if (peerStats.kind === "video") {
            statsOutput += `<strong>framesPerSecond:</strong> ${peerStats.framesPerSecond}<br>\n`;
            statsOutput += `<strong>Video resolution:</strong> ${peerStats.frameWidth} * ${peerStats.frameHeight}<br>\n`;
            statsOutput += `<strong>totalInterFrameDelay:</strong> ${peerStats.totalInterFrameDelay}<br>\n`;
        }

    } else if (peerStats.type === "outbound-rtp") {

        statsOutput += `<strong>packetsSent:</strong> ${peerStats.packetsSent}<br>\n`;
        // unit bit/s
        let sentRate = ((peerStats.bytesSent - (preStats.bytesSent || 0)) * 8) / 5;
        statsOutput += `<strong>bytesSent:</strong> ${peerStats.bytesSent}<br>\n`;
        statsOutput += `<strong>sentRate(bps):</strong> ${sentRate}<br>\n`;

        if (peerStats.kind === "audio") {
            statsOutput += `<strong>targetBitrate:</strong> ${peerStats.targetBitrate}<br>\n`;
        }
        else if (peerStats.kind === "video") {
            statsOutput += `<strong>framesPerSecond:</strong> ${peerStats.framesPerSecond}<br>\n`;
            statsOutput += `<strong>Video resolution:</strong> ${peerStats.frameWidth} * ${peerStats.frameHeight}<br>\n`;
            statsOutput += `<strong>totalPacketSendDelay:</strong> ${peerStats.totalPacketSendDelay}<br>\n`;
        }
    }
    else if (peerStats.type === "remote-inbound-rtp") {
        statsOutput += `<strong>jitter:</strong> ${peerStats.jitter}<br>\n`;
        statsOutput += `<strong>packetsLost:</strong> ${peerStats.packetsLost}<br>\n`;
    } else {

        statsOutput += `<strong>packetsSent:</strong> ${peerStats.packetsSent}<br>\n`;
        statsOutput += `<strong>reportsSent:</strong> ${peerStats.reportsSent}<br>\n`;

        // unit bit/s
        let sentRate = ((peerStats.bytesSent - (preStats.bytesSent || 0)) * 8) / 5;
        statsOutput += `<strong>bytesSent:</strong> ${peerStats.bytesSent}<br>\n`;
        statsOutput += `<strong>sentRate(bps):</strong> ${sentRate}<br>\n`;
    }

    UpdateWebstatis(statsOutput, peerStats.type + peerStats.ssrc);

    return;
}

function updateHistroyStats(peerStats) {
    
    var histroyStats = WT.call._historyStats;
    if (!histroyStats || !peerStats.ssrc) { return; }

    // use type and ssrc to distinguish
    var typeStatsObj = histroyStats[peerStats.type] = histroyStats[peerStats.type] || {};
    var recordStats = typeStatsObj[peerStats.ssrc] = typeStatsObj[peerStats.ssrc] || {};
    var kindStats = typeStatsObj[peerStats.kind] = typeStatsObj[peerStats.kind] || {};

    Object.assign(recordStats, peerStats);
    if (peerStats.kind === "audio"){
        kindStats.audioLevel = peerStats.audioLevel;
    }else{
        kindStats.resolution = peerStats.frameWidth*peerStats.frameHeight;
        kindStats.framesPerSecond = peerStats.framesPerSecond;
    }
    if (peerStats.type === "inbound-rtp") {

        kindStats.packetsReceived = peerStats.packetsReceived;
        kindStats.bytesReceived = peerStats.bytesReceived;
        kindStats.packetsLost = peerStats.packetsLost;

    } else if (peerStats.type === "outbound-rtp") {

        kindStats.packetsSent = peerStats.packetsSent;
        kindStats.bytesSent = peerStats.bytesSent;
    }
    else if (peerStats.type === "remote-inbound-rtp") {
        kindStats.packetsReceived = peerStats.packetsReceived;
        kindStats.bytesReceived = peerStats.bytesReceived;
        kindStats.packetsLost = peerStats.packetsLost;
    } else {
        kindStats.packetsSent = peerStats.packetsSent;
        kindStats.bytesSent = peerStats.bytesSent;
    }

    return;
}

function getStatsFromPC(pc) {
    pc.getStats(null).then(stats => {

        var peerStats = {};

        stats.forEach(report => {

            if (!(/outbound-rtp|inbound-rtp/i.test(report.type))) {
                return;
            }

            if (report.type === "inbound-rtp") {
                peerStats.id = report.id;
                peerStats.type = report.type;
                peerStats.ssrc = report.ssrc;
                peerStats.kind = report.kind;
                peerStats.trackId = report.trackId;
                peerStats.timestamp = report.timestamp;
                peerStats.transportId = report.transportId;
                peerStats.codecId = report.codecId;
                peerStats.mediaType = report.mediaType;
                peerStats.jitter = report.jitter;
                peerStats.packetsLost = report.packetsLost;
                //

                peerStats.packetsReceived = report.packetsReceived;

                peerStats.bytesReceived = report.bytesReceived;
                peerStats.headerBytesReceived = report.headerBytesReceived;
                peerStats.lastPacketReceivedTimestamp = report.lastPacketReceivedTimestamp;
                peerStats.jitterBufferDelay = report.jitterBufferDelay;
                peerStats.jitterBufferEmittedCount = report.jitterBufferEmittedCount;

                peerStats.estimatedPlayoutTimestamp = report.estimatedPlayoutTimestamp;
                if (report.kind === "audio") {

                    peerStats.packetsDiscarded = report.packetsDiscarded;
                    peerStats.remoteId = report.remoteId;

                    peerStats.fecPacketsReceived = report.fecPacketsReceived;
                    peerStats.fecPacketsDiscarded = report.fecPacketsDiscarded;

                    peerStats.totalSamplesReceived = report.totalSamplesReceived;
                    peerStats.concealedSamples = report.concealedSamples;
                    peerStats.silentConcealedSamples = report.silentConcealedSamples;
                    peerStats.concealmentEvents = report.concealmentEvents;
                    peerStats.insertedSamplesForDeceleration = report.insertedSamplesForDeceleration;
                    peerStats.removedSamplesForAcceleration = report.removedSamplesForAcceleration;
                    peerStats.audioLevel = report.audioLevel;
                    peerStats.totalAudioEnergy = report.totalAudioEnergy;
                    peerStats.totalSamplesDuration = report.totalSamplesDuration;

                }
                else if (report.kind === "video") {
                    peerStats.framesReceived = report.framesReceived;
                    peerStats.frameWidth = report.frameWidth;
                    peerStats.frameHeight = report.frameHeight;
                    peerStats.framesPerSecond = report.framesPerSecond;
                    peerStats.framesDecoded = report.framesDecoded;
                    peerStats.keyFramesDecoded = report.keyFramesDecoded;
                    peerStats.framesDropped = report.framesDropped;
                    peerStats.totalDecodeTime = report.totalDecodeTime;
                    peerStats.totalInterFrameDelay = report.totalInterFrameDelay;
                    peerStats.totalSquaredInterFrameDelay = report.totalSquaredInterFrameDelay;
                    peerStats.decoderImplementation = report.decoderImplementation;
                    peerStats.firCount = report.firCount;
                    peerStats.pliCount = report.pliCount;
                    peerStats.nackCount = report.nackCount;
                    peerStats.qpSum = report.qpSum;

                }
            } else if (report.type === "outbound-rtp") {
                peerStats.id = report.id;
                peerStats.type = report.type;
                peerStats.timestamp = report.timestamp;
                peerStats.ssrc = report.ssrc;
                peerStats.kind = report.kind;
                peerStats.trackId = report.trackId;
                peerStats.transportId = report.transportId;
                peerStats.codecId = report.codecId;
                peerStats.mediaType = report.mediaType;

                peerStats.mediaSourceId = report.mediaSourceId;
                peerStats.remoteId = report.remoteId;
                peerStats.packetsSent = report.packetsSent;
                peerStats.retransmittedPacketsSent = report.retransmittedPacketsSent;
                peerStats.bytesSent = report.bytesSent;
                peerStats.headerBytesSent = report.headerBytesSent;
                peerStats.retransmittedBytesSent = report.retransmittedBytesSent;

                peerStats.nackCount = report.nackCount;
                if (report.kind === "audio") {
                    peerStats.targetBitrate = report.targetBitrate;
                }
                else if (report.kind === "video") {
                    peerStats.framesEncoded = report.framesEncoded;
                    peerStats.keyFramesEncoded = report.keyFramesEncoded;
                    peerStats.totalEncodeTime = report.totalEncodeTime;
                    peerStats.totalEncodedBytesTarget = report.totalEncodedBytesTarget;
                    peerStats.frameWidth = report.frameWidth;
                    peerStats.frameHeight = report.frameHeight;
                    peerStats.framesPerSecond = report.framesPerSecond;
                    peerStats.framesSent = report.framesSent;
                    peerStats.hugeFramesSent = report.hugeFramesSent;
                    peerStats.totalPacketSendDelay = report.totalPacketSendDelay;
                    peerStats.qualityLimitationReason = report.qualityLimitationReason;
                    peerStats.qualityLimitationDurations = report.qualityLimitationDurations;
                    peerStats.qualityLimitationResolutionChanges = report.qualityLimitationResolutionChanges;
                    peerStats.encoderImplementation = report.encoderImplementation;
                    peerStats.firCount = report.firCount;
                    peerStats.pliCount = report.pliCount;
                    peerStats.qpSum = report.qpSum;
                }
            }
            else if (report.type === "remote-inbound-rtp") {
                // not difference between video and audio
                peerStats.id = report.id;
                peerStats.type = report.type;
                peerStats.timestamp = report.timestamp;
                peerStats.ssrc = report.ssrc;
                peerStats.kind = report.kind;

                peerStats.transportId = report.transportId;
                peerStats.codecId = report.codecId;
                peerStats.jitter = report.jitter;

                peerStats.packetsLost = report.packetsLost;
                peerStats.localId = report.localId;
                peerStats.roundTripTime = report.roundTripTime;
                peerStats.fractionLost = report.fractionLost;
                peerStats.totalRoundTripTime = report.totalRoundTripTime;
                peerStats.roundTripTimeMeasurements = report.roundTripTimeMeasurements;
            } else {
                peerStats.id = report.id;
                peerStats.type = report.type;
                peerStats.timestamp = report.timestamp;
                peerStats.ssrc = report.ssrc;
                peerStats.kind = report.kind;
                peerStats.transportId = report.transportId;
                peerStats.codecId = report.codecId;
                peerStats.packetsSent = report.packetsSent;


                peerStats.bytesSent = report.bytesSent;
                peerStats.localId = report.localId;
                peerStats.remoteTimestamp = report.remoteTimestamp;
                peerStats.reportsSent = report.reportsSent;
                peerStats.roundTripTimeMeasurements = report.roundTripTimeMeasurements;
                peerStats.totalRoundTripTime = report.totalRoundTripTime;
            }

            displayStatistics(peerStats);
            updateHistroyStats(peerStats);
        });
    });
};


function mayStartStatsTimer(event) {
    var timerId = WT.call._statsTimerId;

    if (/\bconnected|completed/i.test(event.target.iceConnectionState)) {
        if (timerId) {
            console.log("clear timerId:", timerId);
            clearInterval(timerId);
        }
        timerId = setInterval(function () {
            var pc = WT.call._pc;
            getStatsFromPC(pc);
        }, 5000);
        console.log("start timerId:", timerId);
    }

    if (/disconnected|closed|failed/i.test(event.target.iceConnectionState)) {
        if (timerId) {
            console.log("stop timerId:", timerId);
            clearInterval(timerId);
        }
    }
}

function clearStats() 
{
    console.log("clear call statistics...");
    var div = document.getElementById("statisContent");
    while(div.hasChildNodes()) //loop go on if the div has sub node
    {
        div.removeChild(div.firstChild);
    }

    WT.call._historyStats = {};
}
