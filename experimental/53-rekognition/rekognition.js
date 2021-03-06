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

var request = require('request');

module.exports = function(RED) {
    "use strict";
    function RekognitionNode(n) {
        
        RED.nodes.createNode(this,n);

        var node = this;

        this.on('input', function (msg) {

        	request.post({url:'http://rekognition.com/func/api/', form:{
				    'api_key':n.key,
				    'api_secret':n.secret,
				    'jobs':n.jobs,
	                'urls':msg.topic
				  }},
			  	function(err,httpResponse,body){ 
			  		try {
				  		msg.payload = JSON.parse(body);
						node.send(msg);
				  	} catch (e) {
		  				node.send(e)
				  	}
				}
			);

        });

    }
    RED.nodes.registerType("rekognition",RekognitionNode);
}
