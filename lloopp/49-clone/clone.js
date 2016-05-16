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

module.exports = function(RED) {
    "use strict";
    function CloneNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        
        // var getValue = function(obj, path){
        //     for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        //         obj = obj[path[i]];
        //     };
        //     return obj;
        // }

        // function setValue(obj, path, value) {
        //     if (typeof path === "string") {
        //         var path = path.split('.');
        //     }
        //     if(path.length > 1){
        //         var p=path.shift();
        //         if(typeof obj[p] == "undefined" || typeof obj[p]!== 'object'){
        //              obj[p] = {};
        //         }
        //         return setValue(obj[p], path, value);
        //     }else{
        //         obj[path[0]] = value;
        //     }
        // }

        var id = node.id.toString().replace('.','');
        if(!global.globalFunc) global.globalFunc = {};
        var code = 'globalFunc["'+id+'"]=function(msg){msg.'+n.destination+'=msg.'+n.source+'}';
        var script = new vm.Script(code,{displayErrors:true});
        script.runInThisContext();

        this.on('input', function (msg) {

            // took 6378ms with 10M events
            // setValue(msg, n.destination, getValue(msg, n.source))
            
            // took 8ms with 10M events
            globalFunc[id](msg);

            node.send(msg);
        });

    }
    RED.nodes.registerType("clone",CloneNode);
}
