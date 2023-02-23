function filterStatsType(theType) {
    return (/outbound-rtp|inbound-rtp|remote-inbound-type/i.test(theType));
}

function filterStats(stats) {
    let statsOutput = "";

    stats.forEach(report => {
        if(filterStatsType(report.type)) {

            statsOutput += `<hr/><h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;


            Object.keys(report).forEach(statName => {
                if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                    statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
                    console.log(`[stats] ${statName}=${report[statName]}`)
                }
            });

            if(report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
                var trackObj = stats.get(report.trackIdentifier);
                if(trackObj) {
                    statsOutput += `<hr/><h4>Track Stats</h4><strong>trackId:</strong> ${report.trackId}<br>\n`;
                    Object.keys(trackObj).forEach(itemName => {
                        //if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                        statsOutput += `<strong>${itemName}:</strong> ${trackObj[itemName]}<br>\n`;
                        //}
                    });
                }
            }

        }

    });

    return statsOutput;
}

function getStatsFromPC(pc) {
    var statsString = "";
    pc.getStats(null).then(stats => {

        statsString += filterStats(stats);
        updateWebStats(statsString);

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
    var div = document.getElementById("statsContent");
    while(div.hasChildNodes()) //loop go on if the div has sub node
    {
        div.removeChild(div.firstChild);
    }

    WT.call._historyStats = {};
}
