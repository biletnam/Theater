/**
 * Created by Steve on 9/23/2016.
 */

window.onload = init;

function init() {
    output = document.getElementById("websocketlog");
    wsUri = "ws://" + window.location.hostname + ":8280";
    ws = new ReconnectingWebSocket(wsUri);
    ws.onopen = function(evt){
        console.log("websocket connected");
        output.innerHTML = ""; //clear the screen
        writeToScreen("Websocket Connected");
    };
    ws.onmessage = function(evt) {

        var x = JSON.parse(evt.data);
        if (x.object == "settings.things"){
            things = x.data;
            //new things object - do something?
            //  location.reload();

        }
    };

}
function writeToScreen(message) {
    // get time of incoming cue
    lastCueTime = new Date();
    output.innerHTML = message + "<BR>" + output.innerHTML;
    if(message.substr(0,1) != '*' ){
        document.body.style.cursor  = 'default';
    }
}