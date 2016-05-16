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

    var silverstreet = require('silverstreet-sms-adapter');

    function SilverStreetIn(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        var options = {dlr:n.dlr,https:n.https}

        // Setup gateway 
        var gate = new silverstreet.Gateway({
            username : this.credentials ? this.credentials.username : "",
            password : this.credentials ? this.credentials.password : "",
            sender   : n.sender,
            options   : options
        }); 
        
        this.on('input', function (msg) {

          if(typeof msg.payload == "string") {
            body = msg.payload;
          }
           
          // Create message 
          var destination = msg.to || n.destination;
          var body = msg.body || msg.payload || n.body;
          
          if(destination && body) {

            var message = new silverstreet.Message({
                destination : destination,
                body        : body.toString(),
                options     : msg.options
            });
             
            // Send message 
            gate.send(message, function(error) {
                if(!error) {
                  node.send(msg);
                } else {
                  node.error(error)
                }
            });
          }
        
        });

    }RED.nodes.registerType("silverstreet in",SilverStreetIn,{
         credentials: {
             username: {type:"text"},
             password: {type:"password"}
         }});

}
