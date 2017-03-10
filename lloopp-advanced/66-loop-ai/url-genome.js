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
    function UrlGenomeNode(n) {
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
        	msg_.urlList = msg.payload || [];

			node.status({fill:"blue",shape:"dot",text:"computing" });
            
			unirest.post(n.host+'/url/DefaultPersonGenome/computeGenomeForUrlList') 
                        .timeout( parseInt(n.timeout) || 10000)
						.send(JSON.stringify(msg_))
						.end(function(response) {
                            
                            node.status({});
                            console.log(response.body)
                            
                            if(response.status == 200){
    							node.send(response.body);
                            } else {
                                node.error(response.error, msg);
                            }
							
						});

        });

    }
    RED.nodes.registerType("url-genome",UrlGenomeNode);
}
