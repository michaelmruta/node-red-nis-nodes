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

var vm = require('vm'); 

global._ = require('underscore');
global.moment = require('moment');
global.squel = require('squel');
global.crypto = require('crypto');

// global.d = require('durable');
// global.mapreduce = require('mapred')();

module.exports = function(RED) {
    "use strict";
    function JavaScriptNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        
        var id = "_"+node.id.toString().replace('.','');
        if(!global.globalFunc) global.globalFunc = {};
        var code = 'globalFunc["'+id+'"]=function(msg){'+n.func+';return msg}';
        var script = new vm.Script(code,{displayErrors:true});  
        script.runInThisContext();
        
        this.on('input', function (msg) {
            msg = globalFunc[id](msg);
            node.send(msg);
        });

    }
    RED.nodes.registerType("javascript",JavaScriptNode);
}