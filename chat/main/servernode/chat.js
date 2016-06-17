var clients = global.database.clients;
var eve = global.database.eventEmitter;
var moment = require('moment');
var requestProcessor = require("../../request-processor");

var echoDelay = 5000;
var echoJSON = {
    events: "none",
    message: "",
    name: "",
    status: "connected",
    state: pageState,
    ping: echoDelay
};

var chatMessages = ["Чатик запилил. Положить сможете?"];

var pageState = 0;
var prevPageState = 0;
var echoInterval = function(){
    if (prevPageState == pageState)
        clients.echo(echoJSON);
    else {
        var cm = chatMessages;
        var answer = {
            events: "posted",
            message: cm[cm.length-1],
            name: "",
            status: "connected",
            state: pageState,
            ping: echoDelay
        };
        clients.echo(answer);
        prevPageState = pageState;
    }
};
setInterval(echoInterval, echoDelay);
eve.on("posted",echoInterval);
eve.on("subscribe",function(req, res){
    var c = new clients.Client(req, res, "anon");//
    clients.push(c);
});
eve.on("connected",function(res){
    var cm = chatMessages;
    var answer = {
        events: "connected",
        message: cm,
        name: "",
        status: "connected",
        state: pageState,
        ping: echoDelay
    };
    try{
        answer = JSON.stringify(answer);
        res.end(answer);
        console.log("New connect");
    } catch(e){
        console.log("ERROR?");
    }
});

eve.on("post",function(req,res){
    var reqr = new requestProcessor.RequestReflection(req, true);
    var onRead = function() {
        if (reqr.data) {
            console.log(reqr.whois());
            var mdata = '<strong>' + moment().get('hour') + ":" + moment().get('minute') + ":" + moment().get('second') + '</strong>';
            console.log("From " + reqr.ip + " : " + reqr.data.message);
            reqr.data.message = mdata + ": " + reqr.data.message;
            chatMessages.push(reqr.data.message);
            pageState++;
            eve.emit("posted");
            res.end("ok");
        } else {
            console.log("Bad post");
            res.statusCode = 400;
            res.end("bad post");
        }
    };
    var onError = function(){
        console.log("Bad post");
        res.statusCode = 400;
        res.end("bad post");
    };
    reqr.readData(onRead, onError);
    /*
var mess = "";
    req.on("data",function(data){
        mess += data;
        if (mess.length > 1e4){
            res.end("Big message");
            return;
        }
    });
    req.on("end", function(){
        try {
            console.log(mess);
            mess = JSON.parse(mess);
        } catch (e){
            console.log("Bar post");
            res.statusCode = 400;
            res.end("bad post");
        }
        if (mess.message){
            var mdata = '<strong>' + moment().get('hour') + ":" + moment().get('minute') + ":" +moment().get('second') +'</strong>';
            mess.message = mdata + ": " + mess.message;
            chatMessages.push(mess.message);
            pageState++;
            eve.emit("posted");
            res.end("ok");
        }
        res.statusCode = 400;
        res.end("ok");
    });*/
});
eve.on("clear",function(res){
    chatMessages = [" "];
    res.end("cleared");
});