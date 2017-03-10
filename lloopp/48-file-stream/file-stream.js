/**
 * Copyright 2015 Natural Intelligence Solutions
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Michael Angelo Ruta (2015)
 *
 **/

module.exports = function(RED) {
    "use strict";
    var fs = require("fs-extra");
    var byline = require("byline");
    var execSync = require('child_process').execSync;
    var Throttle = require('throttle'); 
    var LineByLineReader = require('line-by-line');

    function FileStreamInNode(n) {
        RED.nodes.createNode(this,n);

        var tps=0;
        var count=0;

        this.filename = n.filename;
        this.format = n.format;
        var node = this;
        
        var options = {};
        var fstream, stream, throttledStream, c = 0, total = 0;
        var tps=0, count=0;
        var timeSpent = 0;
        var REDRAW_INTERVAL = 1;

        var clock;

        var tick = function() {
            timeSpent++;
            if(node) {
                var display = Math.round(c/total * 100);
                if(isNaN(display) || display > 100) {
                   display = c.toLocaleString() + "/" + total.toLocaleString();
                } else {
                   display += "% - " + c.toLocaleString();
                }
                try {
                    node.status({fill:"green",shape:"dot",text:display});
                    var msg_ = { payload:display };
                    node.send([null,null,msg_]);
                } catch(e){
                    node.log(e);
                }
            }
            tps = 0 
        };

        var stopClock = function() {
            if(fstream) {
                fstream.close();
                fstream = null;
            }
            clock = null;
            timeSpent = 0;
            c = 0;
        }

        if (this.format) {
            options['encoding'] = this.format;
        }

        var lr;
        var concurrency = n.concurrency || 100;
        
        this.on("input",function(msg) {

            // msg came from watch node
            if(!msg.filename && typeof msg.payload == 'string' && msg.file && msg.payload.indexOf(msg.file) > 1) {
                msg.topic = "start";
                // delete cwd : /opt/toolbox/
                msg.filename = msg.payload.replace(process.cwd() + "/","");
            }

            var filename = this.filename || msg.filename || "";

            // Line-by-Line
            if( n.lbl == true ) {

                if(msg.topic == "start") {
                    var start = n.start || 0;
                    var end = n.end == "" ? Infinity : n.end;

                    if(!lr) {
                        lr = new LineByLineReader(filename);
                    };

                    if(!clock) { clock = setInterval(tick, 1000*REDRAW_INTERVAL) };
                    timeSpent = 0;

                    var lineNumber = 0

                    lr.on('error', function (err) {
                        node.error(err)
                    });

                    lr.on('line', function (line) {
                        lineNumber += 1;
                        msg.line = lineNumber;
                        if( c >= start && c <= end )  {
                            if(concurrency > 0) {
                                concurrency--;
                            } else {
                                lr.pause();
                            }
                        }
                        c++;
                        if( c >= start && c <= end )  {
                            msg.payload = line;
                            node.send([msg,null]);
                        }
                    });

                    lr.on('end', function () {
                        var done = {filename:filename,objects:c,spent:timeSpent*REDRAW_INTERVAL,status:"ok",topic:"done"};
                        node.send([null,done])
                    });
                } else if(msg.topic == "next") {
                    if(lr) {
                        concurrency +=1;
                        lr.resume();
                    }
                }

            } else {
            // fstream
                    if (msg.filename && n.filename && (n.filename !== msg.filename)) {
                        node.warn("Warning: msg properties can no longer override set node properties. See bit.ly/nr-override-msg-props");
                    }
                    if (filename === "") {
                        node.warn('No filename specified');
                    } else {
                        var start = n.start;
                        var end = n.end == "" ? Infinity : n.end;

                        if(msg.topic == "start" && !fstream) {

                            node.log("Processing: "+filename);

                            if(!clock) { clock = setInterval(tick, 1000*REDRAW_INTERVAL) };
                            timeSpent = 0;

                            fs.stat(filename, function(err, stats) {
                                    if (err){
                                        node.error(err);
                                        stopClock();
                                    }
                                    if( stats && stats.isFile() ){
                                        msg.stats = stats;

                                        // count the number of lines
                                        var cmd = "wc -l '"+filename+"' | awk '{print $1}'";
                                        total = execSync(cmd,{encoding:'utf8'});

                                        fstream = fs.createReadStream(filename,options);

                                        throttledStream = new Throttle({bps: n.byteRate || 131072, 
                                                                        chunkSize: n.chunkSize || 131072, 
                                                                    highWaterMark: n.highWaterMark || 0});

                                        stream = byline.createStream();
                                        stream.on('data', function(record) {
                                            c++;
                                            if( c >= start && c <= end )  {
                                                if(record) {
                                                    msg.payload = record.toString();
                                                }
                                                msg.line = c;
                                                node.send([msg,null]);
                                            }
                                        });
                                        stream.on('error', function(error) {
                                            node.error(err);
                                            var done = {filename:filename,objects:c,spent:timeSpent*REDRAW_INTERVAL,status:"failed"};
                                                if(fstream) {
                                                    if(n.throttle || msg.throttle) {
                                                        fstream.unpipe(throttledStream).unpipe(stream);
                                                    } else {
                                                        fstream.unpipe(stream);
                                                    }
                                                    fstream = null;
                                                }
                                            node.send([null,done])
                                            stopClock();
                                        });
                                        stream.on('end', function(error) {
                                            var done = {filename:filename,objects:c,spent:timeSpent*REDRAW_INTERVAL,status:"ok"};
                                                if(fstream) {
                                                    if(n.throttle || msg.throttle) {
                                                        fstream.unpipe(throttledStream).unpipe(stream);
                                                    } else {
                                                        fstream.unpipe(stream);
                                                    }
                                                    fstream = null;
                                                    node.log("End of stream: "+filename);
                                                }
                                            done.topic = "next";
                                            node.send([null,done])
                                            stopClock();
                                        });

                                        stream.on('close',function(){
                                                if(fstream) {
                                                    if(n.throttle || msg.throttle) {
                                                        fstream.unpipe(throttledStream).unpipe(stream);
                                                    } else {
                                                        fstream.unpipe(stream);
                                                    }
                                                    node.log("Done Processing: "+filename);
                                                    fstream = null;
                                                }
                                        })

                                        if(n.throttle || msg.throttle) {
                                            fstream.pipe(throttledStream).pipe(stream);
                                        } else {
                                            fstream.pipe(stream);
                                        }
                                    }
                                });

                            } else if(msg.topic == "stop" && fstream) {
                                if(n.throttle || msg.throttle) {
                                    fstream.unpipe(throttledStream).unpipe(stream);
                                } else {
                                    fstream.unpipe(stream);
                                }
                                node.status({fill:"gray",shape:"ring",text:"stopped"});
                            } else if(msg.topic == "start" && fstream) {
                                node.error("Resource is busy... cannot process "+filename);
                            } else {
                                node.error("Invalid operation received");
                            }

                        }
                }
        });

        this.on("error", function() {
            if(fstream) {
                fstream.unpipe(throttledStream);
                fstream.unpipe(stream);
            }
            stopClock();
            clearInterval(clock);
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        this.on("close", function() {
            if(fstream) {
                fstream.unpipe(throttledStream);
                fstream.unpipe(stream);
            }
            stopClock();
            clearInterval(clock);
            node.status({fill:"gray",shape:"ring",text:"closed"});
        });

    }
    RED.nodes.registerType("file-stream in",FileStreamInNode);

    function FileStreamOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename;
        this.appendNewline = n.appendNewline;
        this.overwriteFile = n.overwriteFile.toString();
        this.createDir = n.createDir || false;
        var node = this;

        this.on("input",function(msg) {
            var filename = node.filename || msg.filename || "";
            if (filename === "") {
                node.warn(RED._("file.errors.nofilename"));
            } else if (msg.hasOwnProperty("payload") && (typeof msg.payload !== "undefined")) {
                var data = msg.payload;
                if ((typeof data === "object") && (!Buffer.isBuffer(data))) {
                    data = JSON.stringify(data);
                }
                if (typeof data === "boolean") { data = data.toString(); }
                if (typeof data === "number") { data = data.toString(); }
                if ((this.appendNewline) && (!Buffer.isBuffer(data))) { data += os.EOL; }
                if (this.overwriteFile === "true") {
                    // using "binary" not {encoding:"binary"} to be 0.8 compatible for a while
                    fs.writeFile(filename, data, "binary", function (err) {
                    //fs.writeFile(filename, data, {encoding:"binary"}, function (err) {
                        if (err) {
                            if ((err.code === "ENOENT") && node.createDir) {
                                fs.ensureFile(filename, function (err) {
                                    if (err) { node.error(RED._("file.errors.createfail",{error:err.toString()}),msg); }
                                    else {
                                        fs.writeFile(filename, data, "binary", function (err) {
                                            if (err) { node.error(RED._("file.errors.writefail",{error:err.toString()}),msg); }
                                        });
                                    }
                                });
                            }
                            else { node.error(RED._("file.errors.writefail",{error:err.toString()}),msg); }
                        }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.wrotefile",{file:filename})); }
                    });
                }
                else if (this.overwriteFile === "delete") {
                    fs.unlink(filename, function (err) {
                        if (err) { node.error(RED._("file.errors.deletefail",{error:err.toString()}),msg); }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.deletedfile",{file:filename})); }
                    });
                }
                else {
                    // using "binary" not {encoding:"binary"} to be 0.8 compatible for a while longer
                    fs.appendFile(filename, data, "binary", function (err) {
                    //fs.appendFile(filename, data, {encoding:"binary"}, function (err) {
                        if (err) {
                            if ((err.code === "ENOENT") && node.createDir) {
                                fs.ensureFile(filename, function (err) {
                                    if (err) { node.error(RED._("file.errors.createfail",{error:err.toString()}),msg); }
                                    else {
                                        fs.appendFile(filename, data, "binary", function (err) {
                                            if (err) { node.error(RED._("file.errors.appendfail",{error:err.toString()}),msg); }
                                        });
                                    }
                                });
                            }
                            else { node.error(RED._("file.errors.appendfail",{error:err.toString()}),msg); }
                        }
                        else if (RED.settings.verbose) { node.log(RED._("file.status.appendedfile",{file:filename})); }
                    });
                }
            }
        });
    }
    // RED.nodes.registerType("file-stream out",FileStreamOutNode);

}
