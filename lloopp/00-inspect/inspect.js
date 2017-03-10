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
    function InspectNode(n) {

        RED.nodes.createNode(this,n);

        // this.message = {}
        var node = this;
        node.message = n.message || {};
        
        var safeJsonStringify = require('safe-json-stringify');

        // GET - json editor
	    RED.httpAdmin.get("/inspect/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
		    res.setHeader('Content-Type', 'application/json');
            if(node) {
                if(typeof node.message == "string") {
                    try {
                        node.message = JSON.parse(node.message)
                    } catch (e) {
                        node.error(e);
                    }
                }
                res.end( safeJsonStringify(node.message) || "{}");
            } else {
                res.json({"error":"failed to get node.message"});
            }
	    });

        // POST - push button
        RED.httpAdmin.post("/inspect/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            res.setHeader('Content-Type', 'application/json');
            node.send(node.message);
            res.end( safeJsonStringify(node.message) || "{}");
        });

        this.on('input', function (msg) {
            if(typeof msg == "string") {
                node.message = {typeof:"string",msg:msg}
            } else {
                node.message = msg;    
            }
        });

        this.on('close', function () {
            node.message = {};
        });

    }
    RED.nodes.registerType("inspect",InspectNode);
}