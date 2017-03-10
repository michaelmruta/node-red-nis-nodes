/**
 * Copyright 2016 Natural Intelligence Solutions
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
 * Author: Michael Angelo Ruta (2016)
 *
 **/

module.exports = function(RED) {
    "use strict";

    var marklogic = require('marklogic');
    var _ = require('underscore');

    // var dbConn = {
    //   restReader: {
    //     host: 'localhost',
    //     port: 9000,
    //     authType: 'DIGEST',
    //     user: 'rest-reader-user',
    //     password: 'training1'
    //   },
    //   restWriter: {
    //     host: 'localhost',
    //     port: 9000,
    //     authType: 'DIGEST',
    //     user: 'rest-writer-user',
    //     password: 'training1'
    //   },
    //   restAdmin: {
    //     host: 'localhost',
    //     port: 9000,
    //     authType: 'DIGEST',
    //     user: 'rest-admin-user',
    //     password: 'training1'
    //   }
    // };

    // var dbRead = marklogic.createDatabaseClient(dbConn.restReader);
    // var dbWrite = marklogic.createDatabaseClient(dbConn.restWriter);
    // var dbAdmin = marklogic.createDatabaseClient(dbConn.restAdmin);


    function marklogicInNode(n){

        RED.nodes.createNode(this,n);
        var node = this;

        this.on('input', function (msg) {

        });

        this.on("error", function() {
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        this.on("close", function() {

        });
   
    } RED.nodes.registerType("marklogic-in",marklogicInNode);

    function marklogicOutNode(n){

        RED.nodes.createNode(this,n);
        var node = this;

        if (this.credentials && this.credentials.hasOwnProperty("username")) {
            this.username = this.credentials.username;
        }
        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        }
         
        var dbClient = marklogic.createDatabaseClient({
            host: n.host,
            port: n.port,
            authType: n.authType || 'DIGEST',
            user: this.username,
            password: this.password
          });

        this.on('input', function (msg) {
              dbClient.documents.write([
                {
                  "uri": "/" +n.directory+ "/" + msg._id,
                  "contentType": "application/json",
                  "content": msg.payload
                }
              ]).result(
                function(response){
                    msg.response = response;
                    node.send(msg)
                  },
                  function(error){
                  node.error(JSON.stringify(error, null, 2));
              });
        });

        this.on("error", function() {
            node.status({fill:"red",shape:"dot",text:"error"});
        });

        this.on("close", function() {

        });
   
    } RED.nodes.registerType("marklogic-out",marklogicOutNode,{
        credentials: {
            username: { type:"text" },
            password: { type: "password" }
        }
    });
}

