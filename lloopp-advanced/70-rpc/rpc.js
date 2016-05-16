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

var rpc = require('node-json-rpc');
var _ = require('underscore');

module.exports = function(RED) {
    "use strict";

    function RPCInNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var options = {
          port: n.port,
          host: n.host,
          path: '/rpc',
          strict: false
        };

        var server = new rpc.Server(options);

        server.addMethod(n.method, function (result, callback) {
          node.send(result);
          callback(null, "OK");
        });

        server.start(function (error) {
          if (error) throw error;
          else node.log('Rpc server running on '+n.port+'/'+n.method);
        });

    }
    RED.nodes.registerType("rpc-in",RPCInNode);

    function RPCOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        var options = {
          port: n.port,
          host: n.host,
          path: '/rpc',
          strict: false
        };

        var client = new rpc.Client(options);

        this.on('input', function (msg) {

            var message = {}
            if(n.invoke) {
              message = msg;
            }

            client.call(
              {"method":n.method, "params": message},
              function (err, res) {
                if (err) { node.error(err); }
                else { 
                    msg = _.extend(msg, res);
                    node.send(msg); 
                }
              }
            );
        });

    } 
    RED.nodes.registerType("rpc-out",RPCOutNode);

}
