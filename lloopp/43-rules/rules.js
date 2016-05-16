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

var sift = require('sift');
var fs = require('fs');

module.exports = function(RED) {
    "use strict";
	
    function RulesNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        RED.httpAdmin.get("/filters", function(req,res) {
          fs.readFile('config/filters.json', function (err, data) {
            if (err) throw err;
            var stringified;
            try {
              var parsed = JSON.parse(data);
              stringified = JSON.parse(data);
            } catch(e) {
              console.log("Invalid filters configuration.");
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(stringified || []);
          });
        });

        this.on('input', function (msg) {
            if(msg.auConfig) n = msg.autoConfig(n,node.id);

        	if(msg[n.attribute] instanceof Array) {
    			var res = sift(n.query, msg[n.attribute]);
                if(res.length > 0){
                    msg[n.attribute] = res[0];
                    node.send([msg, null]);
                } else {
                    node.send([null, msg]);
                }
        	} else if(msg[n.attribute] instanceof Object) {
    			var res = sift(n.query, [msg[n.attribute]]);
                if(res.length > 0){
                    msg[n.attribute] = res[0];
                    node.send([msg, null]);
                } else {
                    node.send([null, msg]);
                }
        	}
        	return;
        });

    }
    RED.nodes.registerType("rules",RulesNode);
}
