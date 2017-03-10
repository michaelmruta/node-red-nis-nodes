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
// var OAuth = require('oauth');

module.exports = function(RED) {
    "use strict";
    function PersonGenomeNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        var loopAPIKey = n.app;
        var loopUser = n.user;
        var loopPass = n.pass;
        var mashapeKey = n.mashape;

		var redirect = encodeURIComponent('http://profile.loop.ai/loopai/profile?authOnly=true&outputMode=json');
		var headers = { 
		    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
		    'Content-Type' : 'application/x-www-form-urlencoded' 
		};

        this.on('input', function (msg) {

	        var fbUserId = msg.userId || n.fb;
        	var fbAccessToken = msg.tokenString || n.token;

        	if(fbUserId && fbAccessToken) {

	    		var qs = { app_id:loopAPIKey, client_id:loopAPIKey, redirect_uri:redirect }

				var headers = { 
				    'X-Mashape-Key': mashapeKey,
				    'Accept': 'application/json'
				};

	    		var qsCompute = { userId:fbUserId, accessToken:fbAccessToken}

			   	node.status({fill:"green",shape:"dot",text:"connecting" });

				request
				  .get('https://loop-ai-loopai-v1.p.mashape.com/loopai/computeGenomeUsingFacebook', 
						{headers:headers, qs:qsCompute}, function(error, response, body) {
						if(!error && response.statusCode == 200) {

							// console.log("computeGenomeUsingFacebook:")
							// console.log(body)

							body = JSON.parse(body);

							// countdown timer
							var countdown = Math.abs( Math.round( n.timeout/1000 || body.estTimeTilNext/1000 || 1 ));
							var timer = setInterval(function() {
							   countdown-=1;
							   if(!countdown) { 
							   	node.status({});
							   	clearInterval(timer);
							   } else {
							   	node.status({fill:"red",shape:"dot",text:countdown+" sec. remaning" });
							   }
				            }, 1000);

							setTimeout(function() {
			        			var qsRetrieve = { genomeId:body.genomeId, outputmode:'json'}

								request
								  .get('https://loop-ai-loopai-v1.p.mashape.com/loopai/retrieveGenome', 
										{headers:headers, qs:qsRetrieve}, function(error, response, body) {
										if(!error && response.statusCode == 200) {
											msg.payload = JSON.parse(body);

											if(msg.payload.userId) {
												msg.payload.id = msg.payload.userId;
											}

											node.send(msg);
										} else {
											node.log(error);
										}
									})
									.on('error', function(err) {
										node.error(err);
									})

								body.genomeId
							}, n.timeout || body.estTimeTilNext || 1)
						} else {
							node.log(error);
						}
					})
					.on('error', function(err) {
						node.error(err);
					})

			}
        });

    }
    RED.nodes.registerType("person-genome",PersonGenomeNode);
}
