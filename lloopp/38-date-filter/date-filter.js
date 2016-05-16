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
 
 module.exports = function(RED) {
    "use strict";
    function DateFilterNode(n) {

        RED.nodes.createNode(this,n);
        var node = this;

        var filterDate = n.datetimepicker.split("-");
        var filterDateBefore = new Date(filterDate[0]);
        var filterDateAfter = new Date(filterDate[1]);

        var attributeParts = (n.attribute || "payload").split(".");

        this.on('input', function (msg) {
            if(msg.autoConfig) {
              n = msg.autoConfig(n,node.id);
                filterDate = n.datetimepicker.split("-");
                filterDateBefore = new Date(filterDate[0]);
                filterDateAfter = new Date(filterDate[1]);
                attributeParts = (n.attribute || "payload").split(".");
            }

            var prop = attributeParts.reduce(function (obj, i) {
                return obj[i]
            }, msg);
        	var inputDate = new Date(prop);

            if(inputDate instanceof Date ){
                if(filterDateBefore <= inputDate && inputDate <= filterDateAfter){
                    node.send(msg);
                }
            }else{
                node.error("Error: Invalid Date");
            }
        });

    }
    RED.nodes.registerType("date filter",DateFilterNode);
}