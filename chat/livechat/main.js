var loaded = function() {
    text = document.getElementsByClassName("text")[0];
    textfield = document.getElementsByClassName("textfield")[0];
    send = document.getElementsByClassName("send")[0];

    send.addEventListener("click",clicked);
    subscribe();
    connected();
};

var clicked = function(){
    var req = new XMLHttpRequest();
    req.open("POST", "/main/post", true);
    var posted = {};
    posted.message = textfield.value;
    posted = JSON.stringify(posted);
    console.log(posted);
    req.send(posted);
    textfield.value = "";
};

var connected = function(){
    var req = new XMLHttpRequest();
    req.open("POST", "/main/connected", true);
    req.send();
    req.onreadystatechange = function (e) {
        if (req.readyState != 4) return;
        console.log("connected");
        answer = req.responseText;
        try {
            answer = JSON.parse(answer);
            if (answer.events) {
                if (answer.events == "connected") {
                    text.innerHTML = answer.message[0] + "<br>";
                    for (var i = 1; i < answer.message.length; i++) {
                        text.innerHTML = text.innerHTML + answer.message[i] + "<br>";
                    }
                }
            }
        } catch (e) {
            console.log("Bad JSON from server " + answer);
        }
    }
};

var subscribe = function(){
    var answer;
    var req = new XMLHttpRequest();
    req.open("POST", "/main/subscribe", true);
    req.onreadystatechange = function (e) {
        if (req.readyState != 4) return;
        console.log("connected");
        answer = req.responseText;
        try {
            answer = JSON.parse(answer);
            if (answer.events){
                if (answer.events == "posted") {
                    text.innerHTML = answer.message[0] + "<br>";
                    for (var i = 1; i < answer.message.length; i++) {
                        text.innerHTML = text.innerHTML + answer.message[i] + "<br>";
                    }
                    text.scrollTop = text.scrollHeight;
                }
            }
        } catch(e){
            console.log("Bad JSON from server " + answer);
        }
        req.open("POST", "/main/subscribe", true);
        req.send();
    };
    req.send();
};
var text, textfield, send;
window.addEventListener("load",loaded);