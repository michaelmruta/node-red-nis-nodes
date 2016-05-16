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
    var spawn = require('child_process').spawn;
    var exec = require('child_process').exec;
    var isUtf8 = require('is-utf8');
    var shell = require('shelljs');

    function addslashes(str) {
      //  discuss at: http://phpjs.org/functions/addslashes/
      // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Ates Goral (http://magnetiq.com)
      // improved by: marrtins
      // improved by: Nate
      // improved by: Onno Marsman
      // improved by: Brett Zamir (http://brett-zamir.me)
      // improved by: Oskar Larsson Högfeldt (http://oskar-lh.name/)
      //    input by: Denny Wardhana
      //   example 1: addslashes("kevin's birthday");
      //   returns 1: "kevin\\'s birthday"

      return (str + '')
        .replace(/[\\"']/g, '\\$&')
        .replace(/\u0000/g, '\\0');
    }
    
    function InterpreterNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

        var cmd = function(payload) {

           if(payload) {
                if(payload instanceof Array || payload instanceof Object) {
                    shell.env['PAYLOAD'] = JSON.stringify(payload);
                } else {
                    shell.env['PAYLOAD'] = payload;
                }
            }

            switch(n.language) {
                    case "sh":
                        return "sh - <<< $'" + addslashes(n.code) + "'"
                        break;
                    case "c_cpp":
                        return "picoc <<< $'" + addslashes(n.code) + "'"
                        break;
                    case "java":
                        return "java main <<< $'" + addslashes(n.code) + "'"
                        break;
                    case "lua":
                        return "";
                        break;
                    case "matlab":
                        return "";
                        break;
                    case "php":
                        return "php -r $'" + addslashes(n.code) + "'" + " -- `echo $PAYLOAD`";
                        break;
                    case "python":
                        return "python -c $'" + addslashes(n.code) + "'" + " <<< `echo $PAYLOAD`";
                        break;
                    case "ruby":
                        return "ruby - <<< $'" + addslashes(n.code) + "'"
                        break;
                    case "R":
                        return "R --slave --no-save --vanilla <<< $'" + addslashes(n.code) + "'"
                        break;
            }
        }

        this.on("input", function(msg) {

            var child = exec(cmd(msg.payload), {encoding: 'binary', maxBuffer:10000000}, function (error, stdout, stderr) {

                    msg.interpreter = n.language;

                    if(error) {
                        msg.payload = stdout;
                        msg.error = stderr;
                        node.send([null,msg]);
                    } else {
                        msg.payload = new Buffer(stdout,"binary");
                        try {
                            if (isUtf8(msg.payload)) { msg.payload = msg.payload.toString(); }

                            var lines = msg.payload.split("\n");

                            if(n.split) {
                                for (var i = 0; i < lines.length; i++) {
                                    if(msg.payload = lines[i]) {
                                        node.send([msg, null]);
                                    }
                                };
                            } else {
                                node.send([msg, null]);
                            }

                        } catch(e) {
                            msg.payload = stdout;
                            msg.error = "Bad STDOUT";
                            node.send([null,msg]);
                        }
                    }
            });

        });

    }
    RED.nodes.registerType("interpreter",InterpreterNode);
}
