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

    var timeMe = require('time-me');

    function BenchmarkNode(n) {

        RED.nodes.createNode(this,n);
    	var node = this;

        timeMe.configure({
            log: function(msg, obj) { 
                    node.status({fill:"green",shape:"dot",text: obj.elapsed.toLocaleString() + "ms elapsed" });
                }
        });

        this.on('input', function (msg) {
            timeMe.async(n.name || 'benchmark', function(cb) {
                msg.callback = cb;
                node.send(msg);
            })(function() {});
        });


        this.on('error', function (error) {
        	node.error(error)
        });
    }
    RED.nodes.registerType("benchmark",BenchmarkNode);

}
