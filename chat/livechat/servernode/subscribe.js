/**
 * Created by Den10 on 18.04.2016.
 */
var eve = global.database.eventEmitter;

module.exports = function(req,res){
    eve.emit("subscribe", res);
};