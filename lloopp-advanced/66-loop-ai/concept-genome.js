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
    function ConceptGenomeNode(n) {
        RED.nodes.createNode(this,n);
        this.topic = n.topic;
        var node = this;
        var body = ""
        // console.log(atob(":jaiminis"));
        this.on('input', function (msg) {
            // console.log(msg);
            
            var Request = unirest.get('http://lloopp.loop.ai:8300/getConceptList?model=' + msg.payload);
            var x = Request.auth({
                user: '',
                pass: 'jaiminis',
                sendImmediately: true})
            .end(function (response) {                
              // console.log(msg);
              msg.payload = response.body;
              node.send(msg);
              

            });
            
        });
    }
    RED.nodes.registerType("concept",ConceptGenomeNode);

}
