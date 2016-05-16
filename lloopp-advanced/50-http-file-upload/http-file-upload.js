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
    function HttpFileUploadNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;

	    RED.httpNode.post("/upload/"+n.uri, function(req,res) {
	    	try {
				var form = new multiparty.Form();
				    form.parse(req, function(err, fields, files) {

				    	if(err) {
				    		res.status(400);
				    		res.end(err.toString());
				    		node.error(err)
				    	}

						var filename = path.basename(files['file'][0].originalFilename);

						var source = files['file'][0].path;
						var destination = "data/"+n.directory+"/"+filename;

						fs.rename(source, destination, function (err) {
							var ret = {};
								ret.success = true;
								ret.file = destination;

							// res.writeHead(200, {'content-type': 'application/json'});
							// res.end(JSON.stringify(ret));
						});
						node.send({err:err,fields:fields,files:files,basename:filename});
				    });
			} catch(err) {
				node.error(err);
			}
	    });
    }
    RED.nodes.registerType("http-file-upload",HttpFileUploadNode);
}