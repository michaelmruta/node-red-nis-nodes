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

var helpers = require('toolbox-helpers');

module.exports = function(RED) {
    "use strict";

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

    function CounterNode(n) {
        RED.nodes.createNode(this,n);

        var c=0, tps=0;

        var node = this;

        var clock = setInterval(function() {
            if(n.passive) {
                if(n.attribute) {
                    node.status({fill:"green",shape:"dot",text:c.toLocaleString()});
                } else {
                    node.status({fill:"green",shape:"dot",text:c.toLocaleString()+" events @"+tps+" tps" });
                    var payload = c.toLocaleString()+" events @"+tps+" tps" 
                    node.send([null,null,payload])
                }
                tps = 0 
            }
        }, 1000);
        
        var stopClock = function() {
            clearInterval(clock);
            clock = null;
            c = 0;
            tps = 0;
        }

        // gets the parent of the counter attribute
        // var parent = attribute.split(".").splice(0,attribute.split(".").length - 1).join(".");

        var type = n.category || "absolute";

        var rateLimit = 0;

        if(type == "rate")
            node.status({fill:"green",shape:"dot",text:rateLimit+" floating events"}); 
        else
            node.status({}); 

        this.on('input', function (msg) {
            if(msg.config) {
              n = helpers.autoConfig(msg.config,n,node.id);
              type = n.category;
            }

            if(type == "unlimited" || type == "absolute") {
                if(!n.limit || c < n.limit) {

                    var attribute = n.object+ (n.attribute ? "." + n.attribute : "")
                    var value = getValue(msg, attribute);
            
                    if(n.attribute && !isNaN(value)) {
                        c+= parseInt(value);
                    } else {
                        c++; 
                    }

                    if(n.passive == false) {
                        
                        // if no counters is used before, clear the counters
                        if(!msg.delta) {
                            setValue(msg, n.object, {})
                            msg.delta = []
                        }

                        setValue(msg, attribute, parseInt(n.delta) || 1)
                        msg.delta.push(attribute);
                        
                    } else {
                        tps++;
                        msg.tps = tps;
                    }

                    node.send([msg,null]);
                }
            } else if(type == "rate") {

                rateLimit = rateLimit+1;

                setTimeout(function() {
                    rateLimit = rateLimit-1;
                    node.status({fill:"green",shape:"dot",text:rateLimit+" floating events"});
                }, n.interval || 5000 );

                if( rateLimit > n.limit)
                    node.send([null,msg]); 
                else {
                    node.send([msg,null]); 
                }

            }
        });

        this.on('error', function (msg) {
           rateLimit = 0;
           stopClock();
        });

        this.on('close', function () {
           rateLimit = 0;
           stopClock();
        });

    }
    RED.nodes.registerType("counter",CounterNode);
}
