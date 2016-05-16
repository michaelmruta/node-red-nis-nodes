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
    var aerospike = require('aerospike');
    var status = aerospike.status;
    var client = RED.asclient;

    function AerospikeInNode(n){

        RED.nodes.createNode(this,n);
        this.namespace = n.namespace;
        this.set = n.set;
        var node = this;
        var log = n.debug ? node.log : function(){};
        var tps=0, c=0, clock;
        if(!client) {
            node.status({fill:"red",shape:"dot",text:"not connected" });
            client = {};
        } else {
            clock = setInterval(function() { 
            node.status({fill:"green",shape:"dot",text:c+" events @"+tps+" tps" });
            tps = 0 }, 1000);
        }
        var stopClock = function() {
            clearInterval(clock);
            clock = null;
            c = 0;
            tps = 0;
        }

        this.on('input', function (msg) {
            if(typeof msg.payload != "undefined" && typeof msg.payload.id != "undefined"){
                var key = {
                    ns:  this.namespace,
                    set: this.set,
                    key: msg.payload.id.toString()
                };
                 // Retrieve the record using the key.
                client.get(key, function(err, record, metadata, key) {
                    switch ( err.code ) {
                        case status.AEROSPIKE_OK:
                            tps++; c++;
                            msg.profile = record;
                            node.send(msg);
                            log("OK - ", key, metadata, record);
                            break;
                        case status.AEROSPIKE_ERR_RECORD_NOT_FOUND:
                            tps++; c++;
                            node.send(msg);
                            log("NOT_FOUND -", key);
                            break;
                        default:
                            log("ERR - ", err, key);
                        }
                });
            } else {
                log("error: Payload or Payload ID not found.");
            }

        });

        this.on("error", function() {
            stopClock();
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        this.on("close", function() {
            stopClock();
            node.status({fill:"green",shape:"dot",text:c+" records"});
        });
   
    } RED.nodes.registerType("aerospike-in",AerospikeInNode);

    function AerospikeOutNode(n){

        RED.nodes.createNode(this,n);
        this.operation = n.operation;
        this.namespace = n.namespace;
        this.set = n.set;
        var node = this;
        var log = n.debug ? node.log : function(){};
        var tps=0, c=0, clock;
        if(!client) {
            node.status({fill:"red",shape:"dot",text:"not connected" });
            client = {};
        } else {
            clock = setInterval(function() { 
            node.status({fill:"green",shape:"dot",text:c+" events @"+tps+" tps" });
            tps = 0 }, 1000);
        }
        var stopClock = function() {
            clearInterval(clock);
            clock = null;
            c = 0;
            tps = 0;
        }

        this.on('input', function (msg) {
            if(typeof msg.payload != "undefined" && typeof msg.payload.id != "undefined"){
                var rec = msg.profile || msg.payload;

                var key = {
                    ns:  node.namespace,
                    set: node.set,
                    key: msg.payload.id.toString()
                };
                if(node.operation === "insert/update"){
                    log("+ PK: " + key.key);                  
                    client.put(key, rec, function(err) {
                        // Check for err.code in the callback function.
                        // AEROSPIKE_OK signifies the success of put operation.
                        tps++; c++;
                        if ( err.code != aerospike.status.AEROSPIKE_OK ) {
                            log("insert/update error: %s", err.message);
                        }
                    });  

                }else if (node.operation === "remove"){
                    log("- PK: " + key.key);                  
                    client.remove(key, function (err, key) {
                        // err.code == AEROSPIKE_OK signifies the successful completion of deletion operation.
                        tps++; c++;
                        if (err.code !== status.AEROSPIKE_OK) {
                            log("remove error %s",err.message);
                        }
                    });

                }else{
                    this.error("Operation not chosen");
                    this.close();
                }

            } else {
                log("error: Payload or Payload ID not found.");
            }
        });

        this.on("error", function() {
            stopClock();
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        this.on("close", function() {
            stopClock();
            node.status({fill:"green",shape:"ring",text:c+" records"});
        });
   
    } RED.nodes.registerType("aerospike-out",AerospikeOutNode);
}