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
    var path = require('path');
    var _ = require('underscore');
    var glob = require("glob")
 

    function dirTree(pathname, set) {
        var files = glob.sync(pathname, {});
        if(files) {
          for (var i in files) {
                var info = {}
                info.filename = files[i];
                info.basename = path.basename(files[i]);
                info.type = "file";
                info.processed = 0;
                info.spent = 0;
                info.status = "Queued";
                set.push(info);
          }
        };
        return set;
    }

    function accessResource(slist, data, write) {

        if(!data) data = {};

        if(write) {
            var written = fs.writeFileSync('data/sources/'+slist, JSON.stringify(data), { flags: 'wx' })
            data = fs.readFileSync('data/sources/'+slist);
        } else {
            try {
                data = fs.readFileSync('data/sources/'+slist);
            } catch(e) {
                if(e.code == 'ENOENT') {
                    // file not found, initialize
                    var written = fs.writeFileSync('data/sources/'+slist, JSON.stringify(data), { flags: 'wx' })
                    data = fs.readFileSync('data/sources/'+slist);
                }
            }
        }

        return JSON.parse(data);
    }

    function SourceMonitorNode(n) {

        RED.nodes.createNode(this,n);
        var node = this;

        if(n.directory) {
            node.sources = dirTree('data/'+n.directory, []);
        } else {
            node.sources = dirTree('data/dump', []);
        }

        this.files = accessResource(n.slist, node.sources, false);

        var ctr = _.where(this.files, {"status":"Completed"}).length;
        node.status({fill:"blue",shape:"dot",text:ctr + "/" + this.files.length});

        RED.httpAdmin.post("/source/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            res.setHeader('Content-Type', 'application/json');
            if(node) {
                res.send(node.files || {});
            } else {
                res.send('{"error":null}');
            }
        });

        this.on("input",function(msg) {

            if(msg.topic == "reset") {
                ctr = 0;
                this.files = accessResource(n.slist, this.sources, true);
                node.status({fill:"blue",shape:"dot",text:ctr + "/" + this.files.length });
            }

            if(msg.topic == "update") {

                ctr = 0;
                var c1 = accessResource(n.slist, this.sources, false);
                var c2 = (n.directory) ? dirTree('data/'+n.directory, []) 
                                                : dirTree('data/dump', []);

                // addded files
                _.each(c2, function(obj) {
                    if (obj) {
                        var match = _.where(c1,{filename:obj.filename})
                        if(match.length == 0) {
                            c1.push(obj);
                        } 
                    }
                })

                // removed files
                _.each(c1, function(obj) {
                    if(obj) {
                        var match = _.where(c2,{filename:obj.filename})
                        if(match.length == 0) {
                            c1.pop(obj);
                        } 
                    }
                })

                // write changes
                this.files = accessResource(n.slist, c1, true);

                ctr = _.where(c1,{status:"Completed"}).length
                node.status({fill:"blue",shape:"dot",text:ctr + "/" + this.files.length });
            }

            if(msg.topic == "next" || msg.topic == "done") {

                // update source list
                var filesTemp = [];
                var that = this.files;

                var once = false;
                for (var i in that){
                    var file = that[i];
                    if( file.status == "Queued" && msg.filename == file.filename ) {
                        file.status = "Completed";
                        file.processed = msg.objects ? msg.objects.toLocaleString() : "n/a";
                        file.spent = msg.spent + 's';
                        once = true;
                    }
                    filesTemp.push(file)
                }
                this.files = filesTemp;
                accessResource(n.slist, this.files, true);

                var unprocessed = this.files.filter(function(obj) {
                    return obj.status == "Queued";
                });

                var cursor = unprocessed[0] || {};

                if(cursor && cursor.filename && cursor.type == "file") {
                    msg.topic = "start";
                    _.extend(msg,cursor);
                    node.send(msg);
                    ctr +=1;
                }

                if(cursor && cursor.tablename && cursor.type == "table") {
                    msg.topic = "start";
                    _.extend(msg,cursor);
                    node.send(msg);
                    ctr +=1;
                }

                var label = "";
                if(cursor.filename) {
                    label = path.basename(cursor.filename)   
                }else if(cursor.tablename) {
                    label = cursor.tablename;
                }
                node.status({fill:"blue",shape:"dot",text:ctr + "/" 
                                                        + this.files.length 
                                                        + " " + label });

            }

        });

    }
    RED.nodes.registerType("source-monitor",SourceMonitorNode);

}
