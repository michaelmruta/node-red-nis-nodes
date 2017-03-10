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

    var _ =  require('underscore');

    function ComplexEventNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        function group(set, ms, attr)
        {
            return function(value, index, array)
            {   
                
                var d = new Date(value['date']);
                d = Math.floor(d.getTime()/ms*1000);
                set[d]=set[d]||[];
                if(attr)
                    set[d].push(value[attr]);
                else    

                    set[d].push(value);
            }
        }

        function collect(metrics, seconds, attr, windows) {
            var set = {};  
            metrics.map(group(set,seconds,attr));
            if(windows > 1){
                return (_.values(set).splice(-windows));
            }
            else if(windows == 1) {
                return (_.values(set).splice(-windows))[0];
            } else {
                return set;
            }
        }

        this.on('input', function (msg) {  
            
            msg[n.collection+"_windows"] = collect(msg[n.collection], 
                                                        n.timeframe*n.multiplier, 
                                                        n.attribute, 
                                                        Number(n.windows));
            if(n.events) {
                if(msg[n.collection] && msg[n.collection].constructor == Array) {
                    msg[n.collection] = msg[n.collection].slice(-n.events);
                }
            }

            node.send(msg);
        });

        this.on("close", function() {
        });
    }

    RED.nodes.registerType("complex-evt",ComplexEventNode);

}
