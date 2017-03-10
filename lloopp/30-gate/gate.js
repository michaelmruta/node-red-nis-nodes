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

module.exports = function(RED) {
    "use strict";

    function GateNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        if(!node.switch) {
            node.switch = JSON.parse(n.switches) || []
        }

        node.switch = node.switch.splice(0,n.outputs)
        
        for(var ctr=0; ctr<n.outputs;ctr++) {
            if(typeof node.switch[ctr] == 'undefined') {
                node.switch[ctr] = true;
            }
        }

        var status_message = "";
        for(var ctr=0; ctr<n.outputs;ctr++) {
            if(node.switch[ctr] == true) {
                status_message += (ctr+1) + " ";
            }
        }
        
        var status = {fill:"green",shape:"dot",text:status_message};
        if(status_message == "") { status = {fill:"red",shape:"dot",text:"closed"} }
        node.status(status);

        this.on("input",function(msg) {
            var out = []
            for(var ctr=0; ctr<n.outputs;ctr++) {
                out[ctr] = (node.switch[ctr]) ? msg : null
            };
            node.send(out);
        });
    }

    RED.nodes.registerType("gate",GateNode);

    RED.httpAdmin.post("/gate/:id", function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        
        // !isNaN(req.body.id) && !isNaN(req.body.switch)
        if (node != null) {
            try {
 
                if(req.body.switches) {
                    node.switch = req.body.switches;
                    res.json(node.switch);
                } else {
                    var switch_id = req.body.switch
                    node.switch[switch_id] = !node.switch[switch_id]
                    res.json(node.switch);
                }

                var status_message = "";
                for(var ctr=0; ctr<node.switch.length;ctr++) {
                    if(node.switch[ctr] == true) {
                        status_message += (ctr+1) + " ";
                    }
                }
                
                var status = {fill:"green",shape:"dot",text:status_message};
                if(status_message == "") { status = {fill:"red",shape:"dot",text:"closed"} }
                node.status(status);
            
            } catch(err) {
                res.sendStatus(500);
                node.error(err);
            }
        } else {
            res.sendStatus(404);
        }
    });
    RED.httpAdmin.get("/gate/:id", function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                res.json(node.switch);
            } catch(err) {
                res.sendStatus(500);
                node.error({});
            }
        } else {
            res.sendStatus(404);
        }
    });
}
