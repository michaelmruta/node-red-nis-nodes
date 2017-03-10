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
 * Author: Michael Angelo Ruta (2016)
 *
 **/

var fs = require('fs')
var _ = require('underscore')
var helpers = require('toolbox-helpers')

module.exports = function(RED) {
    "use strict";

    var CONFIG_PATH = 'flows/configurations/';

    function setValue(path, val, obj) {
      var fields = path.split('.');
      var result = obj;
      for (var i = 0, n = fields.length; i < n && result !== undefined; i++) {
        var field = fields[i];
        if (i === n - 1) {
          result[field] = val;
        } else {
          if (typeof result[field] === 'undefined' || !_.isObject(result[field])) {
            result[field] = {};
          }
          result = result[field];
        }
      }
    }

    function getConfigFile(id) {
        return CONFIG_PATH+id+".json";
    }

    // GET /configuration/:id };
    RED.httpAdmin.get("/configuration/:id", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var configuration = {}
            try {
                configuration = fs.readFileSync(getConfigFile(req.params.id))
            } catch(e) { node.error(e) }
            res.end( configuration.toString() );
        } else {
            res.json({"Error":"User has no session. Please login to continue..."})
        }
    });

    // POST /configuration/:id {} };
    RED.httpAdmin.post("/configuration/:id", function(req,res) {
        var node = RED.nodes.getNode(req.params.id);

        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var configuration ={}
            try {
                configuration = req.body.data
                node.configuration = configuration
                fs.writeFileSync(getConfigFile(req.params.id),configuration)
            } catch(e) { node.error(e) }
            res.json(JSON.parse(configuration));
        } else {
            res.json({})
        }
    });

    // PUT /configuration/:id&index=0 {} };
    RED.httpAdmin.put("/configuration/:id", function(req,res) {
        var node = RED.nodes.getNode(req.params.id);

        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var configuration ={}
            try {
                if(req.user) {
                    var configurations = JSON.parse(fs.readFileSync(getConfigFile(req.params.id)));
                    configurations[req.query.index] = JSON.parse(req.body)
                    configuration = fs.writeFileSync(getConfigFile(req.params.id),configurations)
                    node.configuration = configuration
                }
            } catch(e) { node.error(e) }
            res.json(configuration);
        } else {
            res.json({"Error":"User has no session. Please login to continue..."})
        }
    });

    // DELETE /configuration/:id index=0;
    RED.httpAdmin.delete("/configuration/:id", function(req,res) {
        var node = RED.nodes.getNode(req.params.id);

        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
           var configuration ={}
            try {
                if(req.user) {
                    var configurations = JSON.parse(fs.readFileSync(getConfigFile(req.params.id)));
                    delete configurations[req.params.index]
                    configuration = fs.writeFileSync(getConfigFile(req.params.id),configurations)
                    node.configuration = configuration
                }
            } catch(e) { node.error(e) }
            res.json(configuration);
        } else {
            res.json({"Error":"User has no session. Please login to continue..."})
        }
    });

    function ConfigurationNode(n) {
    	
        RED.nodes.createNode(this,n);
        var node = this;
        if(!node.configuration) node.configuration = {}
        var file = n.name || node.id

        fs.stat(getConfigFile(file), function(err, stat) {
            if(err == null) {
                console.log('Successfully loaded: '+getConfigFile(file))
            } else if(err.code == 'ENOENT') {
                fs.writeFile(getConfigFile(file), '{}');
            } else {
                console.log('Error: ', err.code);
            }
        });

        node.configuration = JSON.parse(fs.readFileSync(getConfigFile(file)));

        this.on('input', function (msg) {
            msg.timestamp = new Date();

            var configurations = node.configuration;


            if(msg.topic == 'extend') {
                if(msg.payload.key && msg.payload.value) {
                    var delta = setValue(msg.payload.key, msg.payload.value, configurations)
                    fs.writeFileSync(getConfigFile(node.id),JSON.stringify(configurations));
                    node.configuration = configurations
                    node.log('Configuration '+(node.name || node.id)+' has changed.')
                }
            } else {
                try {
                    if(configurations.constructor == Object) {
                        if(msg.code) {
                            msg.config = configurations[msg.code];
                            node.send(msg);
                        } else {
                            _.each(configurations, function(config,index) {
                                msg.config = config;
                                msg.code = index;
                                node.send(msg);
                            })
                        }
                    }
                } catch(e) { node.error(e,msg) }
            }
        });

        this.on('error', function (error) {
        	node.error(error)
        });
    }
    RED.nodes.registerType("configuration",ConfigurationNode);    
}
