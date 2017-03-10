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
var helpers = require('toolbox-helpers');

module.exports = function(RED) {
    "use strict";
	
    function RulesNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        this.config = n;
        this.sent = false;

        var createSQL = function(node, msg){
            if(node.config.table && !node.sent) {

              node.sent = true;              
              var query = "";

              // ANSI SQL
              if(typeof node.config.mode == 'undefined' || node.config.mode == 'sql') {
                query = "SELECT " + node.config.columns + " FROM " + node.config.table;
                if(node.config.query) {
                  query +=  " WHERE " + node.config.query;
                }
                query +=  " LIMIT " + (node.config.offset || 0) + "," + (node.config.limit || 1048576);
                msg.topic = query;
                msg.table = node.config.table;
              }

              // N1QL
              if(node.config.mode == 'n1ql') {
                query = "SELECT " + node.config.columns + " FROM `" + node.config.table + "`";
                if(node.config.query) {
                  query +=  " WHERE " + node.config.query;
                }
                query +=  " LIMIT " + (node.config.limit || 1048576);
                msg.n1ql = query;
              }

              // MongoDB query
              if(node.config.mode == 'mongo') {
                query = node.config.mongo;
                msg.mongo = query;
              }
              
              node.send(msg);
              node.status({fill:"green",shape:"dot",text:"query sent" });
              setTimeout(function(){
                node.sent = false;
                node.status({});
              },10000);
              return query;
            }
            return null;
        }

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

        RED.httpAdmin.post("/query/:id", function(req,res) {
            var node_ = RED.nodes.getNode(req.params.id);
            if(node_.config.mode == 'sift') {
                res.end(res.writeHead(400, "Action button only works with SQL modes"));
            } else {
                var query = createSQL(node_, {});
                res.send({sql:query})
            }
        });

        this.on('input', function (msg) {
            if(msg.config) n = helpers.autoConfig(msg.config,n,node.id);

            if(n.mode == 'sift') {
            	if(msg[n.attribute] instanceof Array) {
        			var res = sift(n.mongodb, msg[n.attribute]);
                    if(res.length > 0){
                        msg[n.attribute] = res;
                        node.send([msg, null]);
                    } else {
                        node.send([null, msg]);
                    }
            	} else if(msg[n.attribute] instanceof Object) {
        			var res = sift(n.mongodb, [msg[n.attribute]]);
                    if(res.length > 0){
                        msg[n.attribute] = res[0];
                        node.send([msg, null]);
                    } else {
                        node.send([null, msg]);
                    }
            	}
            	return;
            } else {
                createSQL(this, msg);
            }
        });

    }
    RED.nodes.registerType("rules",RulesNode);
}
