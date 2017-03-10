var _ = require("underscore")
module.exports = function(RED) {
    "use strict";
    
    var geolib = require("geolib");

    function GeoLibNode(n) {        
        RED.nodes.createNode(this,n);
        var radius = n.radius || 1000;
        this.topic = n.topic;
        var node = this;

        this.on('input', function (msg) {
            if(typeof msg.payload.spot != "undefined" && msg.payload.spot.constructor == Array){
                var locations = []
                var loc = msg.payload.spot                
                _.each(loc,function(value,key){
                    try{
                        if(value.coordinates == "All"){
                            locations.push(value);
                        }else{
                            var data = {
                                lat : (value.coordinates).split(",")[0],
                                lng : (value.coordinates).split(",")[1]
                            }
                            if(geolib.isPointInCircle(data,msg.payload.location,radius)){                            
                                locations.push(value);
                            }
                        }
                    }catch(err){
                        console.log(err)
                        node.error(err);
                    }
                });
                msg.payload = locations;
            }else if(typeof msg.payload.spot != "undefined" && msg.payload.constructor == Object){
                var loc = msg.payload.spot
                var data = {
                        lat : (loc.coordinates).split(",")[0],
                        lng : (loc.coordinates).split(",")[1]

                    }
                try{
                    if(geolib.isPointInCircle(data,msg.payload.location,radius)){
                        msg.payload = msg.payload.spot;
                    }                
                }catch(err){
                    node.error(err)
                }
                
            }           
            node.send(msg);
        });
        this.on("close", function() {
        });
    }
    RED.nodes.registerType("geo-lib",GeoLibNode);
}
