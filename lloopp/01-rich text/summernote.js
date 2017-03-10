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
 **/

var helpers = require('toolbox-helpers')

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

module.exports = function(RED) {
    "use strict";

    function RichTextNode(n) {

        RED.nodes.createNode(this,n);

        var node = this;
        
        this.on('input', function (msg) {

            if(msg.config) n = helpers.autoConfig(msg.config,n,node.id);

            if(n.supplant) {
                msg.topic = n.name.supplant(msg.payload);
                if(msg.html && msg.payload.constructor == Object) {
                    msg[n.attribute] = msg.html.supplant(msg.payload);
                } else {
                    msg[n.attribute] = n.html.supplant(msg.payload);
                }
            } else {
                msg.topic = n.name || "untitled";
                msg[n.attribute] = n.html;
            }
            node.send(msg);
        });

    }
    RED.nodes.registerType("rich-text",RichTextNode);
}
