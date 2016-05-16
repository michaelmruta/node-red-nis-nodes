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
var Linkedin = require('machinepack-linkedin');
var Linkedin = require('node-linkedin')('75vi1h7r1mvb5d', 'jdqT9OcMwoxcOKvi', 'http://lloopp.org:8000/red/api/getAccessTokenLinkedIn');

module.exports = function(RED) {
    "use strict";
    function LinkedInNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        

        this.on('input', function (msg) {
          var url = encodeURIComponent(n.url);
          var client_id = n.client || "";
          var state = n.state || "";
          var scope = n.scopes || "";
          
            unirest.get("https://www.linkedin.com/uas/oauth2/authorization")
          		.header("Accept", "application/json")
              .field({
                "response_type": "code",
                "client_id": client_id,
                "redirect_uri": url,
                "state": state,
                "scope": scope
              }) 
          		.end(function (result) {
          			console.log(result);
          		});
         

        });
    }
    RED.nodes.registerType("linkedin",LinkedInNode);
}
