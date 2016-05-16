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

var soap = require('soap');

module.exports = function(RED) {
    "use strict";

    function SoapClient(n) {
        RED.nodes.createNode(this,n);

        var node = this;

    	var remoteService = function() { node.error('Failed to get service method '+n.service+' of the SOAP API.') };

        var services = [];

        RED.httpAdmin.get("/soap/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            res.setHeader('Content-Type', 'application/json');
            res.send(services);
        });

        var attempts = 3;
        function load() {
     		soap.createClient(n.wsdl, function(err, client) {
	            if(client) { 
	            	services = Object.getOwnPropertyNames(client).filter(function (p) {
	                	return typeof client[p] === 'function';
	            	});
	     			remoteService = client[n.service]; 
	 			} else {
	 				remoteService = function(){};
					node.error("Failed to create SOAP client. Retrying in 10 seconds");
					if(attempts) {
						setTimeout(function(){load()},10000);
						attempts--;
					}
	 			}
			});
		}
		load();

        // This is how to define a synchronous function.
		// remoteService(args)

        // This is how to define an asynchronous function.
		// remoteService(args, cb)

      	// This is how to receive incoming headers
		// remoteService(args, cb, headers)

        this.on('input', function (msg) {
        	if(msg.request) {
        		remoteService( msg.request, function(err, result) {
 		        	if(!err) {
		        		node.send(result);
		        	} else {
		        		node.error(err);
		        	}
		      	});
    		} else {
    			node.error('Message recieved does not have a request data.');
    		}
        });
    }
    RED.nodes.registerType("soap-out",SoapClient);

    // #TODO
    function SoapServer(n) {
        RED.nodes.createNode(this,n);

        var node = this;

    }
    // RED.nodes.registerType("soap-in",SoapServer);

}
