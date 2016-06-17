$(document).ready(function(){
    var helpmess = $(".helpmess");
    setTimeout(function(){
        helpmess.hide("slow", function(){helpmess.remove()});
    },2000);
});