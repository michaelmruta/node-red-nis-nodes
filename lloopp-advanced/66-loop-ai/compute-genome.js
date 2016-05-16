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

        console.log(n);
        // console.log(atob(":jaiminis"));
        this.on('input', function (msg) {
            var model = n.model || msg.model
            
            var value = msg.payload;
            msg.payload = value.slice(0,4000)
            var url = 'http://130.211.250.165:8300/v1.0/computeGenome?model=Sentosa-Test-11-withImbiah&text=' + msg.payload;
            // console.log(url);

            // var Request = unirest.get('http://130.211.250.165:8300/v1.0/computeGenome?model=Sentosa-Test-11-withImbiah&text=' + msg.payload);
            var Request = unirest.get('http://130.211.250.165:8300/v1.0/computeGenome?model=' + model + '&text=' + msg.payload);
            Request.timeout(10000)

            var x = Request.auth({
                user: '',
                pass: 'jaiminis',
                sendImmediately: true})
            .end(function (response) {                

                if(response.error) {
                    node.error(response.error);
                } else if(response.raw_body) {
                    msg.payload = JSON.parse(response.raw_body)
                }
                
                node.send(msg);
            });
            
            
            // console.log(x.headers);
            // console.log(msg);
            // var x = unirest.get('http://lloopp.loop.ai:8300/getConceptList') 
            //     .header('Accept', 'application/json')
            //     .field({ 'model': msg.model })
            //     .end(function(response) {
                    
            //         node.status({});
                    
            //         if(response.status == 200){
            //             node.send(response.body);
            //         } else {
            //             node.error(response.error);
            //         }
                    
            //     });
            //     console.log(x);
        
            
        });
    }
    RED.nodes.registerType("compute",ComputeGenomeNode);

}
