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

    function PredictionNode(n) {

        RED.nodes.createNode(this,n);

        var node = this;

		var predictionio = require('predictionio-driver');

		var client = new predictionio.Events({appId: parseInt(n.appId) || 1, accessKey:  n.key});
		var engine = new predictionio.Engine({url: n.host});

		client.status().
		    then(function(data) {
		    	if(data) {
			    	setTimeout(function () {
	                	node.status({fill:"blue",shape:"dot",text:data.status });
	            	}, 100);
            	}
	    });

        this.on('input', function(msg) {

        	if(msg.topic == "createUser") {
				client.createUser({uid: msg.payload.uid}).
					then(function(result) {
						node.send([result, null]);
					}).
					catch(function(err) {
						node.send([null, err]);
				});
			} else if(msg.topic == "createItem") {
				client.createItem({
				    iid: msg.payload.iid,
				    properties: {
				        itypes: msg.payload.properties || []
				    }, 
				    eventTime: new Date().toISOString()
				}).
			    then(function(result) {
					node.send([result, null]);
			    }).
			    catch(function(err) {
					node.send([null, err]);
			    });
			} else if(msg.topic == "createAction") {
				client.createAction({
					event: 'view',
					uid: msg.payload.uid,
					iid: msg.payload.iid,
					eventTime: new Date().toISOString()
					}).
				then(function(result) {
					node.send([result, null]);
				}).
				catch(function(err) {
					node.send([null, err]);
				});
			} else if(msg.topic == "sendQuery") {
				engine.sendQuery({
					uid: msg.payload.uid,
					n: msg.payload.n || n.appId || 1
				}).
				then(function (result) {
				    node.send([result, null]);
				});			
			} else {
				node.send([null, {error:"unrecognized action"}]);
			}


        });

        this.on('error', function (msg) {
        	node.error(msg);
        });

    }

    RED.nodes.registerType("prediction",PredictionNode);
}
