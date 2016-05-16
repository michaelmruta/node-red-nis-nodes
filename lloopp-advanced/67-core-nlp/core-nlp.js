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

    var exec = require('child_process').exec,child;

        // child = exec('pwd',
        //   function (error, stdout, stderr) {
        //     console.log('stdout: ' + stdout);
        //     console.log('stderr: ' + stderr);
            
        // });

    // var NLP = require('stanford-corenlp');
    // var config = {"nlpPath":"./corenlp","version":"3.4"};
    // var coreNLP = new NLP.StanfordNLP(config);
    

    // var loc = window.location.pathname;
    // console.log(loc);
    function CoreNLPNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;
        // respond to inputs....
        this.on('input', function (msg) {

            // coreNLP.loadPipelineSync();
            // coreNLP.process('This is so good.', function(err, result) {
            //   console.log(err,JSON.stringify(result));
            // });

        });

        this.on("close", function() {
            
        });
    }

    RED.nodes.registerType("core-nlp",CoreNLPNode);

}
