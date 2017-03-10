/**
 * Copyright 2014 IBM Corp.
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
 **/

// If you use this as a template, update the copyright with your own name.


var unirest = require('unirest');
module.exports = function(RED) {
    "use strict";
    function ComputeGenomeNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        var node = this;
        var body = ""

        var endpoint = "http://lloopp.loop.ai:8300/v1.0/computeGenome";

        var username = "";
        var password = "jaiminis";
        var userpass = new Buffer(username+':'+password);
        var auth = userpass.toString('base64');
        
        this.on('input', function (msg) {

            var model = n.model || msg.model

            unirest.post(endpoint + '?cortex=' + model)
                    .headers({'Authorization':'Basic '+auth,'Content-Type':'text/plain'})
                    .timeout(10000)
                    .send(msg.payload)
                    .end(function (response) {
                        if(response.error) {
                            node.error(response.error);
                            msg.error = response.error
                            msg.success = false
                        } else if(response.raw_body) {
                            msg.payload = JSON.parse(response.raw_body)
                            msg.success = true
                        }
                        node.send(msg);
                    });
            
        });
    }
    RED.nodes.registerType("compute",ComputeGenomeNode);

}
