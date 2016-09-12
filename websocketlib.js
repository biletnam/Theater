/**
 * Created by todd on 1/22/14.
 */
websocket = {};
//Set up Web socket for a connection and make it global
exports.listen = function(){
    var WebSocketServer = require('ws').Server;

//Set up the web socket here.. Default port is 8080
    wss = new WebSocketServer({port: 8080}, function(err,res){

        //  console.log(wss.url);
        if (err){
            console.log("Websocket error:"+err);
        }
        else
        {
            console.log("Websocket server Listening on 8080");
        }
    });



    wss.on('connection', function(ws) {

        var i = 0;
        while (true)
        {
            if (!websocket[i]){
                break;
            }
            i++;
        }
        websocket[i]=ws;
        console.log('Websocket Connected Id:'+i);
        var thisId= i;

        //this line sends to twi and cs4 and causes an error on Todds webpage
        // ws.send('Log Window Now Active');

        ws.on('message', function(message) {
            console.log("message :"+message)
            serial.write(message+'\r');

//            level451.wsDataIn(message,thisId);

            //  console.log('received: %s', message,thisId);
        });
        ws.on('close', function(ws){
            console.log('Websocket disconnected Id:'+thisId);
            delete websocket[thisId];
        });
        ws.on('error', function(ws){
            console.log('Websocket Error Id:'+thisId);
            delete websocket[thisId];
        });
    });


    exports.send = function(data,id)
    {

        if (websocket[id])
        {
            websocket[id].send(data);
        } else
        {
//            console.log('keys'+ Object.keys(websocket));
//            console.log('len'+websocket.length);
            //Object.keys(websocket).length -
            //someday fix this so it tracks the number of connections
            for (var i=0; i < 10; i++)
            {
                if (websocket[i])
                {
                    websocket[i].send(data);
                    //console.info("websocket sending to client "+i);
                }


            }

        }

    };
}