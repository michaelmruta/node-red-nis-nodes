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

    function SplunkKVSClient(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        this.on('input', function (msg) {
            data = JSON.stringify(msg)
            var options = { hostname: n.host,
                                      auth: nuser+':'+n.pass,
                                      port: n.port,
                                      path: '/servicesNS/nobody/search/storage/collections/data/' + n.store,
                                      method: 'POST',
                                      rejectUnauthorized: false,
                                      headers:{
                                            'Content-Type': 'application/json',
                                            'Content-Length': data.length
                                      }
                                    };

            var req = https.request(options, function(res) {
                  res.setEncoding('utf8');
                  node.send(res);
            }).on('error', function(error) {
                node.error(error)
            });

            req.write(data);
            req.end();

        });
    }
    RED.nodes.registerType("splunk-kvs",SplunkKVSClient);

}
