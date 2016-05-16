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

var multiparty = require('multiparty');
var path = require('path');
var fs = require("fs");

module.exports = function(RED) {
    "use strict";
    function CameraNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

	    RED.httpAdmin.post("/camera/:id", function(req,res) {

	    	try {
				var form = new multiparty.Form();
			    form.parse(req, function(err, fields, files) {

					var filename = path.basename(files['imageFile'][0].originalFilename,".png")+"-"+Date.now();

					var source = files['imageFile'][0].path;
					var destination = "public/uploads/"+filename+".png";

					var uri = "uploads/"+filename+".png";

					fs.rename(source, destination, function (err) {
						if(req.params.id) {
							var ret = {};
								ret.success = true;
								ret.uri = uri;

							res.writeHead(200, {'content-type': 'application/json'});
							res.end(JSON.stringify(ret));
						}
						if(err) {
							node.error(err)
						} else {
							if(req.params.id == node.id) {
								node.send({"path":destination,"uri":uri});
							}
						}
					});

			    });
			} catch(err) {
				node.error(err);
			}

	    });
    }
    RED.nodes.registerType("camera",CameraNode);
}