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

    function ProvisionNode(n) {
        RED.nodes.createNode(this,n);

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        // respond to inputs....
        this.on('input', function (msg) {
            if(msg.auConfig) n = msg.autoConfig(n,node.id);

			if(!msg.payload.id) {
				this.error('This requires an ID in the msg.payload.');
				this.close();
				return;
			}

			// Provision
            msg.code = n.code;
            msg.action = n.action;
            msg.group = n.group;

            if(n.action == "provision") {
                // New Profile
                var now = (new Date).getTime();


	            if(!msg.profile) {
                    msg.profile = {};
	            	msg.profile = msg.payload;
                }

                if(!msg.profile.campaigns) msg.profile.campaigns = {};

                if(!msg.profile.counters) msg.profile.counters = {};

                if(!msg.profile.activities) msg.profile.activities = {};
                    
                if(!msg.profile.activities) msg.profile.genome = {};
	            
                if(!msg.profile.activities) msg.profile.timetamps = {created:now, modified:now};
                
                if(!msg.profile.activities) msg.profile.status = msg.payload.status || 'ACTIVE';
	            
	            // Existing Profile
            	msg.profile.campaigns[n.code] = n.group;
                
            } else {
            	// Deprovision
                if(msg.profile) {
            	   delete msg.profile.campaigns[n.code];
                }
            }

            node.send(msg);
        });
        
    }
    RED.nodes.registerType("provision",ProvisionNode);
}
