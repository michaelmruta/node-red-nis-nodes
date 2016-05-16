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

var fs = require('fs')
var _ = require('underscore')

module.exports = function(RED) {
    "use strict";

    var CONFIG_PATH = 'flows/configurations/';

    function getConfigFile(id) {
        console.log(CONFIG_PATH+id+".json");
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
            res.json({})
        }
    });

    // POST /configuration/:id {} };
    RED.httpAdmin.post("/configuration/:id", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var configuration ={}
            try {
                configuration = req.body.data
                fs.writeFileSync(getConfigFile(req.params.id),configuration)
            } catch(e) { node.error(e) }
            res.json(JSON.parse(configuration));
        } else {
            res.json({})
        }
    });

    // PUT /configuration/:id&index=0 {} };
    RED.httpAdmin.put("/configuration/:id", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
            var configuration ={}
            try {
                if(req.user) {
                    var configurations = JSON.parse(fs.readFileSync(getConfigFile(req.params.id)));
                    configurations[req.query.index] = JSON.parse(req.body)
                    configuration = fs.writeFileSync(getConfigFile(req.params.id),configurations)
                }
            } catch(e) { node.error(e) }
            res.json(configuration);
        } else {
            res.json({})
        }
    });

    // DELETE /configuration/:id index=0;
    RED.httpAdmin.delete("/configuration/:id", function(req,res) {
        res.setHeader('Content-Type', 'application/json');
        if(req.user) {
           var configuration ={}
            try {
                if(req.user) {
                    var configurations = JSON.parse(fs.readFileSync(getConfigFile(req.params.id)));
                    delete configurations[req.params.index]
                    configuration = fs.writeFileSync(getConfigFile(req.params.id),configurations)
                }
            } catch(e) { node.error(e) }
            res.json(configuration);
        } else {
            res.json({})
        }
    });

    function ConfigurationNode(n) {
    	
        RED.nodes.createNode(this,n);
        var node = this;
        var file = n.name || node.id

        fs.stat(CONFIG_PATH+file, function(err, stat) {
            if(err == null) {
                console.log('Successfully loaded: '+CONFIG_PATH+file)
            } else if(err.code == 'ENOENT') {
                fs.writeFile(CONFIG_PATH+file, '{}');
            } else {
                console.log('Error: ', err.code);
            }
        });

        this.on('input', function (msg) {
            msg.timestamp = new Date();

            msg.autoConfig = function(n_,id_) {
                var config_ = this.config
                if(config_ && config_[id_]) {
                    _.extend(n_, config_[n_.name || id_]);
                }
                return n_;
            }

            try {
                var configurations = JSON.parse(fs.readFileSync(CONFIG_PATH+file));
                if(configurations.constructor == Object) {
                    msg.config = configurations[msg.code || msg.topic];
                    node.send(msg);
                }
            } catch(e) { node.error(e,msg) }
        });

        this.on('error', function (error) {
        	node.error(error)
        });
    }
    RED.nodes.registerType("configuration",ConfigurationNode);

}
