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
 * Author: Michael Angelo Ruta & Alexander Pimentel (2015)
 *
 **/
var d3 = require("d3");
var fs = require("fs");
var vm = require('vm');
var jsdom = require("node-jsdom");

module.exports = function(RED) {
    "use strict";

    var exphbs  = require('express-handlebars');

    function d3Node(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        node.data = {}

        RED.httpNode.get("/d3/:type/:id", function(req,res) {
            var node = RED.nodes.getNode(req.params.id);
            var data = JSON.stringify(node.data || {});
		    res.render("d3s/"+req.params.type, {layout: false, data: data});
        });
    
        this.on('input', function (msg) {
            node.data = msg.data;
        });

    }

    RED.nodes.registerType("d3",d3Node);

}