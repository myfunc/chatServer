/**
 * Created by Den10 on 17.04.2016.
 */
var util = require("util");
var fs = require("fs");
var getIP = function (req) {
    var ip = req.connection.remoteAddress;
    ip = ip.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/);
    if (ip) ip = ip[0];
    return ip;
};
/* Объект RequestReflection представляет только необходимые данные запроса от клиента
 * - Метод запроса
 * - URL
 * - объект данных полученных для запроса
 * */

/* Второй аргумент, читать ли поток сообщение, если метод POST */
var RequestReflection = function(req){
    var self = this;
    if (typeof req == "string"){
        this.method = arguments[0];
        this.url = arguments[1];
        return this;
    }
    if (req.connection)
        this.ip = getIP(req);
    else
        this.ip = "anon";
    this.method = req.method;
    this.url = req.url;
    this.responseLimit = 1000;
    this.statusCode = -1;
    this.message = "";
    this.data = null;
    this.stringData = null;
    this.req = req;
};
RequestReflection.prototype.debugShow = function(){
    console.log(util.inspect(this));
};
RequestReflection.prototype.readData = function(callback, badcallback){
    var self = this;
    if (this.method == "POST"){
        if (badcallback && typeof badcallback != "function") throw new Error("RequestReflection readData: 2nd arg is not function");
        if (callback && typeof callback != "function") throw new Error("RequestReflection readData: 1st arg is not function");
        var requestData = "";
        var onReadable = function(){
            var buff = self.req.read();
            if (buff !== null) {
                requestData += buff;
            }
            if (requestData.length > self.responseLimit){
                self.statusCode = 413;
                self.message = "Data is too big";
                self.data = null;
                self.stringData = null;
                badcallback();
            }
        };
        var onEnd = function(){
            try {
                self.stringData = requestData;
                requestData = JSON.parse(requestData);
                self.data = requestData;
                if (callback) callback();
            } catch (e) {
                console.log(e.message);
                self.statusCode = 400;
                self.message = "Invalid JSON data";
                self.data = null;
                self.stringData = requestData;
                if (badcallback) badcallback();
            }
        };
        this.req.on("readable",onReadable);
        this.req.on("end",onEnd);
    }
};
RequestReflection.prototype.whois = function(){
    return this.method + " " + this.ip + " " + this.stringData + " " + this.url;
};

RequestReflection.prototype.compare = function(obj, compareData){
    if (!(obj instanceof RequestReflection)) return false;
    if (this.method !== obj.method) return false;
    if (this.url !== obj.url) return false;
    if (compareData === true && (this.stringData !== obj.stringData)) return false;
    return true;
};

RequestReflection.prototype.contains = function(obj, compareData){
    if (!(obj instanceof RequestReflection)) return false;
    if (this.method != "ALL" && this.method !== obj.method) return false;
    if (obj.url.indexOf(this.url) == -1) return false;
    if (compareData === true && (this.stringData !== obj.stringData)) return false;
    return true;
};

/* ResponseTemplate - объект ответа */
var ResponseTemplate = function(data, statusCode){
    this.statusCode = statusCode || 200;
    if (typeof data != "string" && typeof data != "function")
        throw new Error("ResponseTemplate constructor: invalid data. Need 'string' or 'function' type");
    this.sendData = data;
};
ResponseTemplate.prototype.send = function(req, res, defaultResponse){
    res.statusCode = this.statusCode;
        if (typeof this.sendData == "function") {
            if (req && res) {
                try {
                    if (this.sendData(req, res, defaultResponse.sendData))
                        return true;
                } catch (e) {
                    console.log("Error: " + e.message);
                    return true;
                }
            }
            else throw new Error("ResponseTemplate send: req or res is not valid");
        }
    else
        res.end(this.sendData);
};

/* RequestProcessor - обработчик запросов */
var ReqObj = function(reqr,rest){
    if (reqr instanceof RequestReflection)
        this.reqr = reqr;
    else if (typeof reqr.url == "string"  && reqr.method) this.reqr = new RequestReflection(reqr.method, reqr.url);
    else throw new Error("ReqObj constructor: reqr is not RequestReflection");
    if (rest instanceof ResponseTemplate)
        this.rest = rest;
    else if (rest.statusCode && rest.sendData) this.rest = new ResponseTemplate(rest.sendData,rest.statusCode);
    else throw new Error("ReqObj constructor: rest is not ResponseTemplate");
};
/* Проверяется только reqr !!! */
ReqObj.prototype.compare = function(obj, urlContains){
    if (urlContains) {
        if (obj.reqr)
            return this.reqr.contains(obj.reqr);
        else
            return this.reqr.contains(obj);
    } else {
        if (obj.reqr)
            return this.reqr.compare(obj.reqr);
        else
            return this.reqr.compare(obj);
    }
};

var RequestProcessor = function(urlContains){
    this._indexCounter = 0;
    if (urlContains == true)
        this.urlContains = true;
    this.requests = {};
    this.defaultResponse = new ResponseTemplate("Page not found", 404);
};
RequestProcessor.prototype.push = function(reqr,rest,name){
    var template = new ReqObj(reqr,rest);
    template.name = name || this._indexCounter++;
    this.requests[template.name] = template;
};

RequestProcessor.prototype.setDefaultPage = function(data, statusCode){
    this.defaultResponse = new ResponseTemplate(data, statusCode);
};

RequestProcessor.prototype.processRequest = function(req, res){
    var reqr = new RequestReflection(req, true);
    if (reqr.url.indexOf("/main/subscribe") == -1)
    //filelog(reqr.method + " " + reqr.ip + " " + reqr.stringData + " " + reqr.url + "\n");
    console.log(reqr.method + " " + reqr.ip + " " + reqr.stringData + " " + reqr.url);
    for (var obj in this.requests){
        if (this.requests[obj].compare(reqr, this.urlContains)){
            if (this.requests[obj].rest.send(req, res, this.defaultResponse, reqr.url)) break;
            return true;
        }
    }
    this.defaultResponse.send(req, res);
    return false;
};

RequestProcessor.prototype.pushJSON = function(JSONfile){
    var config = fs.readFileSync(JSONfile,'utf8');
    try {
        config = JSON.parse(config);
    } catch(e) {
        throw new Error("RequestProcessor pushJSON: invalid JSON file config");
    }
    if (!config) throw new Error("RequestProcessor pushJSON: invalid config content");
    if (!util.isArray(config)) throw new Error("RequestProcessor pushJSON: invalid config content. Need Array");
    for (var i = 0; i < config.length; i++){
        if (!config[i].reqr) throw new Error("RequestProcessor pushJSON: invalid config content. 'reqr' index: " + i);
        if (!config[i].rest) throw new Error("RequestProcessor pushJSON: invalid config content. 'rest' index: " + i);
    }
    for (var i = 0; i < config.length; i++){
        if (config[i].rest.sendScript){
            config[i].rest.sendData = require(config[i].rest.sendScript);
        }
        this.push(
            config[i].reqr,
            config[i].rest
        );
    }
};

exports.RequestReflection = RequestReflection;
exports.ResponseTemplate = ResponseTemplate;
exports.RequestProcessor = RequestProcessor;