/**
 * Created by steve on 9/7/2016 .
 */

// LOCAL LIBRARY has the functions unique to this project.
// we use it to start mongo and retrieve the settings object


//Initialization Section
// ll - llib is the local library

ll = require('./llib.js');
// start mongo and load a settings object - passing the database name , and a call back
ll.startmongo('theatersettings',mongostarted);
// open up some ports for the webserver

externalIpAddress = 'localhost';
ll.mapExternalPorts(function(externip){
// opens the ports 8282 and 8280 on the gateway
// 8280 is used for websockets
//8282 is the webserver


    externalIpAddress = externip;
});
// get the websocket handler going
websock=require('l451lib').websocket;
wsh = require('./websockethandler');
websock.start(wsh.wsData,8280);

// start the webserver on port 8282
webserver = require('./webserver.js');
webserver.start(function(rslt){console.log(rslt)});






// all initialization that needs mongo started goes here
function mongostarted(returnedsettings){
    global.settings = returnedsettings;
    // no settings found - init settings
    if (!settings.type){
        settings.type = "settings";
        settings.things = [];
        console.error("Gatherer Settings missing attempting to create the database...");
        db.collection('settings').insertOne(settings, function (err, res) {
            console.log("Gatherer settings created " + res);
            console.log("please RESTART");
            // exit node with error
            process.exit(1);
        });
    } else
    {
      // the settings object is loaded - init whatever else
        smartthings=require('l451lib').smartthingslink;
        sth=require('./smartthingshandler.js');
        smartthings.start(sth.stEvent,8200);

 //  ll.executecommand(ll.getthingbylabel('Switch 3'),'Switch',100);
      //addtestrbgled(); // add to database - run once
        //ll.executecommand(ll.getthingbyid(1000),'setledcolor',[0,100,0]);
       // ll.executecommand(ll.getthingbyid(1000),'setledcolor',1);
       //sth.addchild(ll.getthingbyid("1000"));
    }
}

function addtestrbgled(){
    o={}
    o.name = "test strip 1";
    o.id =  "1000";
    o.type  = 'RGB LED Segment';
    o.startled = 5;
    o.endled = 10;
    o.namespace ="level451";
    o.commands = [];
    o.commands[0]= {};
    o.commands[0].name = 'setlevel';
    o.commands[0].sendto = "RGBLED";
    o.commands[0].sendtoaddress = 'http://192.168.2.71:8201';
    o.commands[0].command = { command: 'setlevel'};
    o.commands[1]= {};
    o.commands[1].name = 'setledcolor';
    o.commands[1].sendto = "RGBLED";
    o.commands[1].sendtoaddress = 'http://192.168.2.71:8201';
    o.commands[1].command = { command: 'ledSetColor'};
    o.commands[2]= {};
    o.commands[2].name = 'setcolor';
    o.commands[2].sendto = "RGBLED";
    o.commands[2].sendtoaddress = 'http://192.168.2.71:8201';
    o.commands[2].command = { command: 'setcolor'} ;

    ll.writething(o,true);//modifies record in  mongo



}