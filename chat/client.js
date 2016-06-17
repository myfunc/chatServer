var util = require("util");
var requestProcessor = require("./request-processor");
var ids = 0;
var Client = function(req, res, name, id){
    if (!res || !res.end) throw new Error("Client constructor: Invalid response object");
    this.name = name;
    this.id = id || ids++;
    this.res = res;
    this.req = req;
};
Client.prototype.whois = function(){
    var reqr = new requestProcessor.RequestReflection(this.req,true);
    return reqr.whois();
};
Client.prototype.send = function(data, dataType){
    this.res.writeHead(200, { "content-type": "text/x-json"});
    this.res.end(data);
};

var ClientBase = function(){
    this.clients = {};
};
ClientBase.prototype.echo = function(data){
    if (typeof data == "object");
    try {
        data = JSON.stringify(data);
    } catch(e){
        throw new Error("ClientBase echo: JSON can't stringify the object");
    }
    for (var c in this.clients){
        this.clients[c].send(data, "JSON");
    }
    this.clear();
};
ClientBase.prototype.push = function(client){
    if (!client instanceof Client) throw new Error("ClientBase push: 1st argument is not Client object");
    this.clients[client.id] = client;
};
ClientBase.prototype.clear = function(){
    this.clients = {};
};
ClientBase.prototype.online = function(){
    var i = 0;
    for (var o in this.clients){i++};
    return i;
}
// id or client Obj 
ClientBase.prototype.sendTo = function(client, data){
    if (client instanceof Client){
        for (var c in this.clients){
            if (client.id == this.clients[c].id){
                this.clients[c].send(data, "JSON");
                delete this.clients[c];
                return true;
            }
        }
    } else if (typeof client == "string"){
        for (var c in this.clients){
            if (client == this.clients[c].id){
                this.clients[c].send(data, "JSON");
                delete this.clients[c];
                return true;
            }
        }
    }
    return false;
};

ClientBase.prototype.Client = Client;

module.exports = new ClientBase();