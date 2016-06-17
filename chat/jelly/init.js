(function(){
    // Canvas
    var winX = innerWidth;
    var winY = innerHeight;
    var canvas = document.createElement("canvas");
    canvas.width = winX+50
    canvas.height = winY+50;
    canvas.id = "canv";
    document.write(canvas.outerHTML);

    // Click to me
    var message = document.createElement("span");
    message.textContent = "click";
    message.className = "helpmess";
    document.write(message.outerHTML);
})();