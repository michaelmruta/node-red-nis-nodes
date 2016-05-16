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

var fs = require('fs');

module.exports = function(RED) {
    "use strict";
	
    function QueryNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        this.config = n;
        this.sent = false;

        var createSQL = function(node){
            if(node.config.table && !node.sent) {

              node.sent = true;
              var msg = {};

              // ANSI SQL
              var query = "SELECT " + node.config.columns + " FROM " + node.config.table;
              if(node.config.query) {
                query +=  " WHERE " + node.config.query;
              }
              query +=  " LIMIT " + (node.config.offset || 0) + "," + (node.config.limit || 1048576);
              msg.topic = query;

              // N1QL
              var n1ql = "SELECT " + node.config.columns + " FROM `" + node.config.table + "`";
              if(node.config.query) {
                query +=  " WHERE " + node.config.query;
              }
              n1ql +=  " LIMIT " + (node.config.limit || 1048576);
              msg.n1ql = n1ql;

              msg.table = node.config.table;
              
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
            var node = RED.nodes.getNode(req.params.id);
            var query = createSQL( node );
            res.send({sql:query})
        });

        this.on('input', function (msg) {            
            msg.query = createSQL(this);
            node.send(msg);
        });

    }
    RED.nodes.registerType("query",QueryNode);
}