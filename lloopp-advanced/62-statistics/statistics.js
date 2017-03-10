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
 
var ss = require('simple-statistics');

module.exports = function(RED) {
    "use strict";
    
    function StatisticsNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // min
        // max
        // sum
        // count
        // average
        // mean
        // median
        // mode
        // geometric_mean
        // harmonic_mean
        // variance
        // sample-variance
        // standard_deviation

        this.on('input', function (msg) {

            if(typeof msg[n.attribute] != "undefined"
            	&& msg[n.attribute].constructor == Array){

                msg.metrics = {};
                var data = msg[n.attribute]

                if(n.min) {
                    msg.metrics.min = ss.min(data)
                }
                if(n.max) {
                    msg.metrics.max = ss.max(data)
                }
                if(n.sum) {
                    msg.metrics.sum = ss.sum(data)
                }
                if(n.count) {
                    msg.metrics.count = data.length
                }
                if(n.average) {
                    msg.metrics.average = ss.average(data)
                }
                if(n.mean) {
                    msg.metrics.mean = ss.mean(data)
                }
                if(n.median) {
                    msg.metrics.median = ss.median(data)
                }
                if(n.mode) {
                    msg.metrics.mode = ss.mode(data)
                }
                if(n.geometric_mean) {
                    msg.metrics.geometric_mean = ss.geometricMean(data)
                }
                if(n.harmonic_mean) {
                    msg.metrics.harmonic_mean = ss.harmonicMean(data)
                }
                if(n.variance) {
                    msg.metrics.variance = ss.variance(data)
                }
                if(n.sample_variance) {
                    msg.metrics.sample_variance = ss.sampleVariance(data)
                }
                if(n.standard_deviation) {
                    msg.metrics.standard_deviation = ss.standardDeviation(data)
                }

                this.send(msg);
            }
            
        });

    }

    RED.nodes.registerType("statistics",StatisticsNode);

}
