var http =  require("http");
var util = require("util");
var fs = require("fs");
var requestProcessor = require("./request-processor");
var static = require('node-static');
var events = require('events');
var processor = new requestProcessor.RequestProcessor(true);

global.database = {};
global.database.eventEmitter = new events.EventEmitter();

processor.pushJSON("./domains.json");

http.createServer(function(req,res){
    processor.processRequest(req,res);
}).listen(80);


var c = console.log;
console.log = function(){
    c.apply(global,arguments);
    global.filelog(arguments[0] + "\n");
};

var logs = fs.openSync("logs.txt","a");
global.filelog = function(text){
    fs.write(logs,text);
};