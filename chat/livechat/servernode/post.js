var eve = global.database.eventEmitter;

module.exports = function(req,res){
    eve.emit("post",req,res);
};