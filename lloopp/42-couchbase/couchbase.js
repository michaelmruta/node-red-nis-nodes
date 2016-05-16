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
    var couchbase = require('couchbase');
    var _ = require('underscore');

    var getValue = function(obj, path){
        for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
            obj = obj[path[i]];
        };
        return obj;
    }

    function setValue(obj, path, value) {
        if (typeof path === "string") {
            var path = path.split('.');
        }
        if(path.length > 1){
            var p=path.shift();
            if(typeof obj[p] == "undefined" || typeof obj[p]!== 'object'){
                 obj[p] = {};
            }
            return setValue(obj[p], path, value);
        }else{
            obj[path[0]] = value;
        }
    }

    function CouchbaseInNode(n){

        RED.nodes.createNode(this,n);

        var cluster = new couchbase.Cluster(n.cluster);
        var bucket = cluster.openBucket(n.bucket);
        if(n.opTimeout)
            bucket.opTimeout = n.opTimeout;

        var lockTime = parseInt(n.lockTime) || undefined;

        var node = this;
        var log = n.debug ? node.log : function(){};
        var tps=0, c=0, clock;
        if(!cluster) {
            node.status({fill:"red",shape:"dot",text:"not connected" });
            cluster = {};
        } else {
            clock = setInterval(function() { 
            node.status({fill:"green",shape:"dot",text:c+" events @"+Math.round(tps/2)+" tps" });
            tps = 0 }, 2000);
        }
        var stopClock = function() {
            clearInterval(clock);
            clock = null;
            c = 0;
            tps = 0;
        }

        var queue = []

        this.on('input', function (msg) {

            if(n.unlock == true) {
                msg.unlock = true;
            }

            if(msg.n1ql) {
                var query = couchbase.N1qlQuery.fromString(msg.n1ql);
                bucket.query(query, function(err, res) {
                  if (err) {
                    node.error(err);
                    return;
                  }
                  if(res instanceof Array){

                    for(var i in res) {
                        tps++; c++;
                        msg.line = parseInt(i)+1;
                        msg.payload = res[i][msg.table];
                        delete msg.topic;
                        delete msg.n1ql;
                        node.send(msg);
                    }
                  } else {  
                    msg.payload = res;
                    delete msg.topic;
                    delete msg.n1ql;
                    node.send(msg);
                  }
                });

            } else if(typeof msg.payload != "undefined" && typeof msg.payload.id != "undefined"){

                if(!msg[n.model]) msg[n.model] = {};

                var rec = msg[n.model] || msg.payload;
                var id = msg[n.model].id || msg.payload.id;

                if(id && typeof id != "string") id = id.toString();

                var fetch = function(msg) {

                    return function(err, result) {

                        if(msg.unlock == true) {
                            if(result) {
                                bucket.unlock(id,result.cas,{}, function(err, result) {
                                    // node.log(result);
                                    }
                                )
                            }
                        }

                        if (err) {
                            if(err.code === couchbase.errors.keyNotFound) {
                                node.send(msg);
                            } else {
                                if(err.code == 11)  {

                                    // retry attempt
                                    if(queue.indexOf(msg) == -1) {
                                        queue.push(msg);
                                        // console.log( "PUSING::" +queue.length+ " - " + msg.payload.rewardId)
                                    }

                                    // DEBUG
                                        // _.mapObject(queue, function(val) {                                      
                                        //   console.log(val.payload.rewardId)
                                        // });

                                    setTimeout( function() {
                                        var msg_ = _.extend({}, queue.shift());
                                        bucket.getAndLock( id.toString() , {lockTime:lockTime}, fetch(msg_));
                                        // console.log( "POPING::" +queue.length+ " - " + msg_.payload.rewardId)
                                    }, (n.lockTimeout * 1000) );

                                } else {
                                    console.log(err.code)
                                    // node.error(err);
                                }
                            }
                        }  else {
                            tps++; c++;

                            if(result && result.value) {
                                var values = result.value || {};
                                msg[n.model] = values || {} ;

                                if( values.campaigns && values.campaigns[msg.code]) {
                                    msg.group = values.campaigns[msg.code];
                                }
                                if(result.cas) {
                                    msg.cas = result.cas
                                }
                                node.send(msg);
                            } else {
                                node.send(msg);
                            }

                        }
                    };

                }

                if(lockTime) {
                    // lock data for 1 second if it has delta values
                    bucket.getAndLock(id, {lockTime:lockTime}, fetch(msg) );
                } else {
                    bucket.get(id, fetch(msg) );
                }

            } else if(msg.n1ql_index) {
                var query = couchbase.N1qlQuery.fromString("CREATE PRIMARY INDEX ON `"+msg.n1ql_index+"`");
                bucket.query(query, function(err, res) {
                  if (err) {
                    node.error(err);
                    return;
                  }
                  msg.payload = res;
                  node.send(msg);
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
   
    } RED.nodes.registerType("couchbase-in",CouchbaseInNode);

    function CouchbaseOutNode(n){

        RED.nodes.createNode(this,n);
        this.operation = n.operation;
   
        var cluster = new couchbase.Cluster(n.cluster);
        var bucket = cluster.openBucket(n.bucket);
        if(n.opTimeout)
            bucket.opTimeout = n.opTimeout;

        var lockTime = parseInt(n.lockTime) || 1;

        var node = this;
        var log = n.debug ? node.log : function(){};
        var tps=0, c=0, clock;
        if(!cluster) {
            node.status({fill:"red",shape:"dot",text:"not connected" });
            cluster = {};
        } else {
            clock = setInterval(function() { 
            node.status({fill:"green",shape:"dot",text:c+" events @"+Math.round(tps/2)+" tps" });
            tps = 0 }, 2000);
        }
        var stopClock = function() {
            clearInterval(clock);
            clock = null;
            c = 0;
            tps = 0;
        }

        this.on('input', function (msg) {

            if(typeof msg.payload != "undefined" && typeof msg.payload.id != "undefined"){
                var rec = msg[n.model] || msg.payload;
                
                if(!msg[n.model]) msg[n.model] = {};

                var rec = _.clone( msg[n.model] || msg.payload );
                var id = msg[n.model].id || msg.payload.id;

                if(id && typeof id != "string") id = id.toString();

                // upsert:
                // if object is in Server (CAS), delay insert retrieval for 1 second
                // then execute upsert function (f)
                // loop through msg.delta and add its values to current counters.

                if(node.operation === "upsert"){

                    // log("+ ID: " + id); 

                    var f = function(err, result) {   

                        if (err) {
                            if(err.code === couchbase.errors.keyNotFound) {
                                bucket.upsert(id, rec, function(err, result) {
                                    tps++; c++;
                                    if (err) node.error(err);
                                    bucket.get(id, function(err, result) {
                                        if (err) node.error(err);
                                        msg[n.model] = result ? result.value || {} : {};
                                        node.send(msg);
                                    });
                                });
                            } else {
                                if(err.code == 11)  {
                                    // retry attempt
                                    setTimeout( function() {
                                        bucket.getAndLock(id, {lockTime:lockTime}, f);
                                    }, n.lockTimeout * 1000);

                                }
                            }
                        } else {
                            // Copy all new properties in the exiting object.
                                var counters = rec.counters;
                                delete rec.counters
                                rec = _.extend(result.value, rec);

                            if(msg.reset instanceof Array) {
                                _.each(msg.reset, function(attribute) {
                                    // set to Zero
                                    // setValue(rec, "counters."+attribute, 0);

                                    // delete attribute
                                    if(rec.counters) {
                                        delete rec.counters[attribute]
                                    }
                                });
                            } else if(msg.reset == "*") {
                                rec.counters = {}
                            }

                            if(msg.delta instanceof Array) {
                                _.each(msg.delta, function(attribute) {

                                    var delta = getValue(msg, attribute);
                                    var attribute_ = attribute.split(".").slice(1).join(".")
                                    var result = ( getValue(rec, attribute_) || 0 ) + delta;
                                    
                                    setValue(rec, attribute_, result);
                                });
                            }

                            // unlock and upsert
                            var cb = function(err, result_) {
                                            tps++; c++;
                                            if (err) node.error(err);
                                            bucket.get(id, function(err, result_) {
                                                if (err) node.error(err);
                                                msg[n.model] = result_ ? result_.value || {} : {};
                                                node.send(msg);
                                            });
                                    }

                            if(msg.unlock == true) {
                                bucket.unlock(id,msg.cas,{}, function(err, result) {
                                    bucket.upsert(id, rec, cb);
                                });
                            } else {
                                bucket.upsert(id, rec, function(err, result_) {
                                    tps++; c++;
                                    if (err) node.error(err);
                                    bucket.get(id, function(err, result_) {
                                        if (err) node.error(err);
                                        msg[n.model] = result_ ? result_.value || {} : {};
                                        node.send(msg);
                                    });
                                });
                            }
                        }

                    }
             
                    if(msg.delta instanceof Array) {
                        // lock data for 1 second if it has delta values
                        if(msg.unlock == true) {
                            bucket.get(id, f);
                        } else {
                            bucket.getAndLock(id, {lockTime:lockTime}, f);
                        }

                    } else {
                        bucket.get(id, f);
                    }

                }else if(node.operation === "insert"){
                    log("+ ID: " + id); 
                    
                    bucket.upsert(id, rec, function(err, result) {
                        tps++; c++;
                        if (err) node.error(err);
                        bucket.get(id, function(err, result) {
                            if (err) node.error(err);
                            msg[n.model] = result ? result.value || {} : {};
                            node.send(msg);
                        });
                    });

                }else if (node.operation === "remove"){
                    log("+ ID: " + id); 
                    bucket.remove(id, function (err, result) {
                        tps++; c++;
                        if (err) node.error(err);
                        msg.payload = result || {};
                        node.send(msg);
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
   
    } RED.nodes.registerType("couchbase-out",CouchbaseOutNode);
}
