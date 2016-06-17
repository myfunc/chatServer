var static = require('node-static');
var requestProcessor = require("../request-processor");
global.database.clients = require("../client");
var processor = new requestProcessor.RequestProcessor(true);
var chat = require("./servernode/chat");
processor.pushJSON("./main/responseList.json");

// Текущее состояние страницы


module.exports = function(req,res, defaultPage, currurl){
    var processed = false;
    // Защита от просмотра файла.
    
    if (req.url.match(/request.js/)) return true;
    processor.setDefaultPage(defaultPage, 404);
    // CODE BEGIN
    
    processed = processor.processRequest(req,res);
    
    // END
    if (req.url.match(/servernode/)) return true;
   if (!processed) staticEnd(req, res);
};

function staticEnd(req,res, defaultPage){
    var file = new static.Server('.');
    file.serve(req, res, function (e, r) {
        if (e && (e.status === 404)) {
            if (typeof defaultPage == "function")
                defaultPage(req, res);
            else
                res.end(defaultPage);
        }
    });
}