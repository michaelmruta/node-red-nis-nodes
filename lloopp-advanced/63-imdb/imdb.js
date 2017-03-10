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
 * Author: Michael Angelo Ruta (2016)
 *
 **/

var loki = require('lokijs');

module.exports = function(RED) {
    "use strict";

    var db = new loki("./data/imdb.json")

    function IMDBNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        db.loadDatabase({}, function () {
            node.collection = db.getCollection(n.collection)
            if(!node.collection) {
                node.collection = db.addCollection(n.collection)
                console.log("adding new collection: "+n.collection)
            }
            node.collection.ensureUniqueIndex("_key");
        });
        
        this.on('input', function (msg) {

            if(msg.topic == "save") {
                db.save();
                msg.status = "SAVED"
                node.send(msg)
                return;
            }

            if(n.kv == true) {
                if(msg.topic == "get" ) {
                    var data = node.collection.by("_key",msg._key||msg.payload)
                    if(data) {
                        msg._key = data._key;
                        msg.payload = data.value;
                        msg.status = "READ"
                    }
                    node.send(msg)
                    return
                } else if(msg.topic == "set" ) {
                    var data = {}
                        data.value = msg.payload
                        data._key = msg._key
                        try {
                            node.collection.insert(data)
                                msg.status = "CREATE"
                        } catch(e) {
                            var data = node.collection.by("_key",msg._key)
                                data.value = msg.payload
                                msg.status = "UPDATE"
                            node.collection.update(data)
                        }
                    node.send(msg)
                    return
                }
            } else {
                if(typeof msg._key != "string" && typeof msg._key != "number") {
                    node.error("IMDB requires the attribute <strong>msg._key</strong>")
                    return
                }

                if(msg.payload.constructor != Object ) {
                    node.error("IMDB can only store javascript Objects or {}")
                    return
                }

                if(msg.topic == "get" ) {
                    msg.payload = node.collection.by("_key",msg._key)
                    node.send(msg);
                }

                if(msg.topic == "set") {
                    msg.payload._key = msg._key
                    try {
                        node.collection.insert(msg.payload)
                        node.send(msg);
                    } catch(e) {
                        node.error(e);
                    }
                }

                if(msg.topic == "set") {
                    msg.payload._key = msg._key
                    try {
                        node.collection.insert(msg.payload)
                        node.send(msg);
                    } catch(e) {
                        node.error(e);
                    }
                }
            }
        });
   
        this.on('close', function () {
            db.save();
        });

        // var shutdown = function(sig) {
        //  db.save(function() {
        //      node.log('imdb closed..');
        //     });
        // };

        // process.once('SIGINT',shutdown);
        // process.once('SIGTERM',shutdown);

    }

    RED.nodes.registerType("imdb",IMDBNode);

}

