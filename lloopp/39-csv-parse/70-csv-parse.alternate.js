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
 
var parse = require('csv-parse');

module.exports = function(RED) {
    "use strict";
    function CSVParseNode(n) {
        RED.nodes.createNode(this,n);
        this.template = (n.temp || "").split(",");
        this.sep = (n.sep || ',').replace("\\t","\t").replace("\\n","\n").replace("\\r","\r").replace("\\x05","\x05");
        this.quo = '"';
        this.ret = (n.ret || "\n").replace("\\n","\n").replace("\\r","\r");
        this.winflag = (this.ret === "\r\n");
        this.lineend = "\n";
        this.multi = n.multi || "one";
        this.hdrin = n.hdrin || false;
        this.hdrout = n.hdrout || false;
        this.goodtmpl = true;
        var node = this;

        // pass in an array of column names to be trimed, de-quoted and retrimed
        var clean = function(col) {
            for (var t = 0; t < col.length; t++) {
                col[t] = col[t].trim(); // remove leading and trailing whitespace
                if (col[t].charAt(0) === '"' && col[t].charAt(col[t].length -1) === '"') {
                    // remove leading and trailing quotes (if they exist) - and remove whitepace again.
                    col[t] = col[t].substr(1,col[t].length -2).trim();
                }
            }
            if ((col.length === 1) && (col[0] === "")) { node.goodtmpl = false; }
            else { node.goodtmpl = true; }
            return col;
        }
        node.template = clean(node.template);

        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload")) {
                if (typeof msg.payload == "object") { // convert object to CSV string
                    try {
                        var ou = "";
                        if (node.hdrout) {
                            ou += node.template.join(node.sep) + node.ret;
                        }
                        if (!Array.isArray(msg.payload)) { msg.payload = [ msg.payload ]; }
                        for (var s = 0; s < msg.payload.length; s++) {
                            for (var t=0; t < node.template.length; t++) {

                                // aaargh - resorting to eval here - but fairly contained front and back.
                                var p = RED.util.ensureString(eval("msg.payload[s]."+node.template[t]));

                                if (p === "undefined") { p = ""; }
                                if (p.indexOf(node.sep) != -1) { // add quotes if any "commas"
                                    ou += node.quo + p + node.quo + node.sep;
                                }
                                else if (p.indexOf(node.quo) != -1) { // add double quotes if any quotes
                                    p = p.replace(/"/g, '""');
                                    ou += node.quo + p + node.quo + node.sep;
                                }
                                else { ou += p + node.sep; } // otherwise just add
                            }
                            ou = ou.slice(0,-1) + node.ret; // remove final "comma" and add "newline"
                        }
                        msg.payload = ou;
                        node.send(msg);
                    }
                    catch(e) { node.error(e,msg); }
                }
                else if (typeof msg.payload == "string") { // convert CSV string to object
                    try {
                        parse(msg.payload, {delimiter: this.sep,columns: this.template}, function(err, parsed){
                            if(err) {
                                node.error(err);
                            } else {
                                msg.line = parse.count;
                                msg.payload = parsed[0];
                                node.send(msg);
                            }
                        });                        
                    }
                    catch(e) { node.error(e,msg); }
                }
                else { node.warn(RED._("csv.errors.csv_js")); }
            }
            else { node.send(msg); } // If no payload - just pass it on.
        });
    }
    RED.nodes.registerType("csv-parse",CSVParseNode);
}
