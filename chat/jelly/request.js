var static = require('node-static');
module.exports = function(req,res, defaultPage){
    if (req.url.match(/request.js/)) return true;
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