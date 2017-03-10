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
    function FacePPNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
       
        this.on('input', function (msg) {
            var url = msg.topic || encodeURIComponent(n.url);
            if(url) {
                unirest.get("https://faceplusplus-faceplusplus.p.mashape.com/detection/detect?attribute="+encodeURIComponent(n.attributes)+"&url="+url)
        		.header("X-Mashape-Key", n.mashape)
        		.header("Accept", "application/json")
        		.end(function (result) {
        			msg.payload = result.body
        			node.send(msg);
        		});
            } else {
                node.send(msg);
            }

        });
    }
    RED.nodes.registerType("facepp",FacePPNode);
}
