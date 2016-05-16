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

var unirest = require('unirest');

module.exports = function(RED) {
    "use strict";
    function ProductGenomeNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        var identifierParts = (n.identifier || "payload.id").split(".");

        this.on('input', function (msg) {

        	var msg_ = {}
            var prop = identifierParts.reduce(function (obj, i) {
                return obj[i]
            }, msg);
        	msg_.numThreads = n.numThreads;
        	msg_.genomeId = prop || "default";
        	msg_.urlList = msg.payload || '[]';

			node.status({fill:"blue",shape:"dot",text:"computing" });
            
            if(topic="define") {
                var model = {}

                if(msg.model && msg.model.match(/^[a-zA-Z0-9]*$/)) {
                    unirest.post(n.host+'/defineDataSet') 
                        .send(JSON.stringify( {"model":msg.model} ))
                        .end(function(response) {
                            
                            node.status({});
                            
                            if(response.status == 200){
                                node.send(response.body);
                            } else {
                                node.error(response.error);
                            }
                            
                        });
                }
            }
                 
            if(topic="train") {
                // if basic

                // FILE/POST /addData?name={NAME}&type={“raw”, “json”, or ”gz”}
                // NAME must start with a letter and contain only [a-zA-Z0-9_-]
                // if “raw”, all text in file will be used as training data
                // if “json”, structure must be {“url”: TEXT, “text”: TEXT} in form that is readable with standard json libraries
                // if “gz”, then compressed file must be in JSON format above

                // unirest.post('http://mockbin.com/request')
                // .header('Accept', 'application/json')
                // .field({
                //   'parameter': 'value'
                // })
                // .attach({
                //   'file': 'dog.png',
                //   'relative file': fs.createReadStream(path.join(__dirname, 'dog.png')),
                //   'remote file': unirest.request('http://google.com/doodle.png')
                // })
                // .end(function (response) {
                //   console.log(response.body);
                // })


                if(msg.payload instanceof Array) {
                    model.name = msg.model;

                    unirest.get(n.host+'/computeGenome') 
                        .header('Accept', 'application/json')
                        .field({ 'model': msg.model })
                        .end(function(response) {
                            
                            node.status({});
                            
                            if(response.status == 200){
                                node.send(response.body);
                            } else {
                                node.error(response.error);
                            }
                            
                        });
                }
                    
                if(msg.payload instanceof String) {
                    unirest.post(n.host+'/computeGenome') 
                        .send(JSON.stringify( {"model":msg.model, text:msg.payload} ))
                        .end(function(response) {
                            
                            node.status({});
                            
                            if(response.status == 200){
                                node.send(response.body);
                            } else {
                                node.error(response.error);
                            }
                            
                        });
                }

                
            }          

        });

    }
    RED.nodes.registerType("product-genome",ProductGenomeNode);
}
