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

var helpers = require('toolbox-helpers');

module.exports = function(RED) {
    "use strict";

    RED.httpAdmin.get("/campaign/user", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var u = {}
            u.username = req.user.username
            u.name = req.user.name
            u.role = req.user.role
            u.permission = req.user.permission
            u.email = req.user.email
            res.send(JSON.stringify( u ));
        } else {
            res.send('{"user":null}');
        }
    });

    function CampaignNode(n) {
    	
        RED.nodes.createNode(this,n);
        var node = this;

        var once;

        this.on('input', function (msg) {
            if(msg.config) n = helpers.autoConfig(msg.config,n,node.id);

			msg.code = n.code;
			if(n.status == "Approved") {

               if(msg.profile && msg.profile.campaigns) {

                    if( msg.profile.campaigns[msg.code] == "target") {
                        node.send([msg,null]); 
                    } else if( msg.profile.campaigns[msg.code] == "control") {
                        node.send([null,msg]); 
                    }

               } else if(msg.payload && msg.payload.campaigns) {
    
                   if( msg.payload.campaigns[msg.code] == "target") {
                        node.send([msg,null]); 
                    } else if( msg.payload.campaigns[msg.code] == "control") {
                        node.send([null,msg]); 
                    }

               } else {
                    node.send([null,null,msg]); 
               }
               
            } else {
				if(msg.topic == "stop") once = false;
            	if(!once) {
            		if(msg.topic == "start")  {
						once = true;
            			throw (n.code || "X-###") + " is not yet approved. This data stream was closed.";
        			}
            	}
            }
        });

        this.on('error', function (error) {
        	node.error(error)
        });
    }
    RED.nodes.registerType("campaign",CampaignNode);

}
