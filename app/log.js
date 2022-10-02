
 var WT = (function (WT) {
    WT = WT || {};

    var log = WT.log = WT.log || {};
    $.extend(log, {
        _logSaver: null,

        makeLogString: function (arguments) {
            if(!arguments.length){
                return "";
            }
            else{
                var msg = "";
                for(var i = 0; i < arguments.length; i++){
                    msg += arguments[i];
                    msg += " ";
                }
                return msg;
            }

        },

        _getLogPrefix: function() {
            var date = new Date();
            var strTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
            var prefix = strTime + ' [WT]';

            var err = new Error();
            var callstack = err.stack.split("\n");
            if (navigator.mozGetUserMedia) { //firefox
                var caller = callstack[2];
                var str = caller.slice(0, caller.lastIndexOf(':'));
                var filename = str.slice(str.lastIndexOf('/') + 1, str.lastIndexOf(':'));
                var lineNum = str.slice(str.lastIndexOf(':') + 1, str.length);
                prefix += ' [' + filename + ':' + lineNum + ']';
            }
            else if (navigator.webkitGetUserMedia) { //chrome
                var caller = callstack[3];
                var str = caller.slice(0, caller.lastIndexOf(':'));
                var filename = str.slice(str.lastIndexOf('/') + 1, str.lastIndexOf(':'));
                var lineNum = str.slice(str.lastIndexOf(':') + 1, str.length);
                str = str.slice(0, str.lastIndexOf(' ')); //at objectName.yourMethodName
                var funcName = str.slice(str.lastIndexOf(' ') + 1, str.length);
                if (funcName.indexOf('.') >= 0) { //objectName.yourMethodName
                    funcName = funcName.slice(funcName.lastIndexOf('.') + 1, funcName.length);
                }
                prefix += ' [' + filename + ':' + lineNum + ' ' + funcName + ']';
            }
            else { //not firefox or chrome
                //do nothing
            }

            return prefix;
        },
        //added by walter for troubleshooting
        setLogSaver: function(saver) {
            this._logSaver = saver;
        },

        log: function () {
            var prefix = this._getLogPrefix();
            var args = Array.prototype.slice.apply(arguments);
            args.unshift(prefix);
            this._logSaver && this._logSaver.call(this, args);
            window.console.log.apply(console, args);
        },

        error: function () {
            var prefix = this._getLogPrefix();
            var args = Array.prototype.slice.apply(arguments);
            args.unshift(prefix);
            this._logSaver && this._logSaver.call(this, args);
            window.console.error.apply(console, args);
        },

        info: function() {
            var prefix = this._getLogPrefix();
            var args = Array.prototype.slice.apply(arguments);
            args.unshift(prefix);
            this._logSaver && this._logSaver.call(this, args);
            window.console.info.apply(console, args);
        },

        warn: function() {

            var prefix = this._getLogPrefix();
            var args = Array.prototype.slice.apply(arguments);
            args.unshift(prefix);
            this._logSaver && this._logSaver.call(this, args);
            window.console.warn.apply(console, args);
        }

    });


    return WT;
}(WT));
