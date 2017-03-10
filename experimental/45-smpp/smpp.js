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

    var smpp = require('smpp');

    // Encodings
    // This smpp implementation supports 3 encodings: ASCII (GSM 03.38), LATIN1, and UCS2. Respective data_coding for these encodings are 0x01, 0x03, and 0x08.
    // smpp.encodings.default = 'LATIN1'

    function SmppOut(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var username="", password="";
        if (this.credentials && this.credentials.hasOwnProperty("username")) {
            username = this.credentials.username;
        } 
        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            password = this.credentials.password;
        } 

        var pdu;
        var session = smpp.connect(n.host, n.port || 2775);
        
        session.bind_transceiver({
            system_id: username,
            password: password
        }, function(pdu_) {
            pdu = pdu_;
            if (pdu.command_status == 0) {
                node.status({fill:"green",shape:"dot",text:"connected"});
            } else {
                node.status({fill:"red",shape:"ring",text:"cmd status: " + pdu.command_status});
            }
        });

        session.on('enquire_link', function(pdu) {
          session.send(pdu.response());
        });
        
        session.on('error', function(pdu) {
            node.error(pdu)
        });
           
        this.on('input', function (msg) {

                var destination = msg.to || n.destination;
                var body = msg.payload || n.body;

                session.submit_sm({
                    destination_addr: destination,
                    short_message: body
                }, function(pdu) {
                    if (pdu.command_status == 0) {
                        msg.message_id = pdu.message_id;
                        node.send();
                    }
                });
        
        });

        this.on('close', function() {
          session.on('unbind', function(pdu) {
              session.send(pdu.response());
              session.close();
          });
        })

    }RED.nodes.registerType("smpp out",SmppOut,{
         credentials: {
             username: {type:"text"},
             password: {type:"password"}
   }});

}
