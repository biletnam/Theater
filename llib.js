/**
 * LOCAL LIBRARY
 * Created by todd on 3/16/2016.
 */
var request = require('request');

MC = require('mongodb').MongoClient;





exports.startmongo = function(collectionname,callback) {
// starts the mongo collection
// returns the settings object from the database

    MC.connect('mongodb://localhost:27017/'+collectionname, function (err, db) {

        if (!err) {
            console.log("MongoDB Connected:");
            global.db = db;
            //load setting database into memory

            db.collection('settings').findOne({"type": "settings"}, function (err, result) {
                if (result) {
                    console.log("Gatherer Settings loaded");
                    callback(result);
                } else {
                    //retrun an empty object
                    callback({});
                }
            });


        } else {
            console.log("No mongo connection")
        }


    });
};
exports.savesettings = function(){
    db.collection('settings').updateOne({'type':'settings'},settings,{upsert:true, w:1},function(err,res){
        //console.log('Gatherer Setting updated');
        if (err){
            console.log('failure writing settings to mongo -- aborting');
            // exit node with error
            process.exit(1);
        }
    });

};
exports.backupsettings = function(){
    var backupsettings = settings;
    delete backupsettings._id;
    backupsettings.timestamp = new Date();
    backupsettings.type='backupsettings';
    db.collection('settings').insertOne(backupsettings,function(err,res){
        //console.log('Gatherer Setting updated');
        if (err){
            console.log('failure writing settings to mongo -- aborting'+err);
            // exit node with error
            process.exit(1);
        }
    });

};
exports.getthingbyid = function(inid){
    var returnvalue = false;


    settings.things.some(function(e){
        if (e.id == inid){
            returnvalue = e;
            return true;
        }
    });

    return returnvalue;
};
exports.getthingbylabel = function(inlabel){
    var returnvalue = false;


    settings.things.some(function(e){
        if (e.label == inlabel){
            returnvalue = e;
            return true;
        }
    });

    return returnvalue;
};
exports.getthingbystid = function(inid){
    var returnvalue = false;


    settings.things.some(function(e){
        if (e.stid == inid){
            returnvalue = e;
            return true;
        }
    });

    return returnvalue;
};
exports.writething = function(obj,savesettings,dontmerge){
    // This adds or updates an object to the settings

    if (!obj.id){return false;}

    // update whatever webpages with the new data
    if(typeof(websock) != 'undefined'){
        websock.send(JSON.stringify({object:"settings.things",data:settings.things}));
    }


    var indexval = -1;
    settings.things.some(function(e,index){
        if (e.id == obj.id){
            indexval = index;
            return true;
        }
    });
    if (indexval != -1 && !dontmerge){


        for (var prop in obj){
            settings.things[indexval][prop] = obj[prop];
            //   console.log( obj[prop])
        }
//        settings.things[indexval] = obj;

    }else if (indexval != -1 && dontmerge){
        // just skip - already on entry
        return;


    }
    else// add item
    {
        settings.things.push(obj);
        console.log('added object');
    }
    if (savesettings){
        console.log('save settings')
        this.savesettings();
    }

};
exports.executecommand = function(obj,commandname,value,delay){
    if (delay){
        setTimeout(function(obj,commandname,value){ll.executecommand(obj,command,value)},delay,obj,command,value);


        console.log('delay command');
        return;
    }
    console.log('exec command');

    if (typeof(obj) != "object"){
        obj=this.getthingbyid(obj);


    }



    var cmd = false;
    /* modified to allow passing of obects for the command*/
    if (typeof(commandname) == "object"){
        cmd = commandname;
    } else
    {
        obj.commands.some(function(e) {
            if (e.name == commandname) {
                cmd = e;
                return true;
            }
        });

    }
    console.log("execute command:"+cmd.name+" val:"+value+' name:'+obj.name);
    if (cmd){
        if (cmd.sendto == 'vantage'){
            serial.write(cmd.command.replace("{value}",value));

        } else
        if (cmd.sendto == "smartthings"){

            var request_options = {
                headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
            };
            request_options.uri = stsettings.restUri+ '/update';
            request_options.json = {
                id: obj.stid,// vantage light aa look at me
                command: cmd.command,
                value: Number(value)
            };
            request(request_options,function(error, response, body){
                console.log('command sent to StartThings');
            });

            //

        } else if (cmd.sendto == "logitec-harmony"){

            console.log('command sent to harmony');
            hc.sendcommand2(cmd.command);





        }else if (cmd.sendto == "RGBLED")
        {
            console.log(cmd)
            request_options = {}
            request_options.uri = cmd.sendtoaddress;
            request_options.json = cmd.command;
            request_options.json.led = 2
            request_options.json.value = value;
            request_options.json.obj = obj;

            // send the command to our RGB Controller
            request(request_options,function(error, response, body){
                // we get here if the RBG server reponds or it errors out
                if (body){
                    // if we get a body the server responded
                    console.log('command sent to RGBLED');
                    //console.log(body.command);
                    var o = body.obj;
                    if (o.issmartthingchild) {
                        //
                        var request_options = {
                            headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
                        };
                        request_options.uri = stsettings.restUri+ '/update';
                        request_options.json = {
                            id: o.stid,// vantage light aa look at me
                            // this command
                            command:commandname,

                            value: body.value
                            // value: evt[4]
                        };


                        request(request_options,function(error, response, body){

                            console.log('Sent status change to SmartThings for:'+ o.name+' Response:'+JSON.stringify(body));




                        });
                        //
                    }
                }


            });




        } else
        {
            console.log('unknown sendto:'+sendto)

        }



    }


};




// exports.executecommand = function(obj,command,value,delay){
//     if (delay){
//         setTimeout(function(obj,command,value){ll.executecommand(obj,command,value)},delay,obj,command,value);
//
//
//         console.log('delay command');
//         return;
//     }
//     console.log('exec command');
//
//     if (typeof(obj) != "object"){
//         obj=this.getthingbyid(obj);
//     }
//
//
//     var cmd = false;
//
//    // console.log("execute command:"+command+" val:"+value+' name:'+obj.name);
//     /* modified to allow passing of obects for the command*/
//     if (typeof(command) == "object"){
//         cmd = command;
//         command = cmd.command;
//
//     } else
//     {
//         obj.commands.some(function(e) {
//             if (e.name == command) {
//                 cmd = e;
//                 return true;
//             }
//         });
//
//     }
//     console.log("execute command:"+cmd.name+" val:"+value+' name:'+obj.name);
//
//     if (cmd){
//         if (cmd.sendto == 'vantage'){
//             serial.write(cmd.command.replace("{value}",value));
//
//         } else if (cmd.sendto == "smartthings"){
// //
//             var request_options = {
//                 headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
//             };
//             request_options.uri = stsettings.restUri+ '/update';
//             request_options.json = {
//                 id: obj.stid,// vantage light aa look at me
//                 command: command,
//                 value: Number(value)
//             };
//             request(request_options,function(error, response, body){
//                 console.log('command sent to StartThings');
//             });
//
//             //
//
//         } else if (cmd.sendto == "logitec-harmony"){
//
//             console.log('command sent to harmony');
//             hc.sendcommand2(cmd.command);
//
//
//
//
//
//         } else if (cmd.sendto == "RGBLED")
//         {
//             console.log(cmd)
//             request_options = {}
//             request_options.uri = cmd.sendtoaddress;
//             request_options.json = cmd.command;
//             request_options.json.led = 2
//             request_options.json.value = value;
//             request_options.json.obj = obj;
//
//             // send the command to our RGB Controller
//             request(request_options,function(error, response, body){
//                 // we get here if the RBG server reponds or it errors out
//                 if (body){
//                     // if we get a body the server responded
//                     console.log('command sent to RGBLED');
//                     //console.log(body.command);
//                     var o = body.obj;
//                     if (o.issmartthingchild) {
//                         //
//                         var request_options = {
//                             headers: { Authorization: 'Bearer ' + settings.stsettings.smartthingsoauthtoken}
//                         };
//                         request_options.uri = stsettings.restUri+ '/update';
//                         request_options.json = {
//                             id: o.stid,// vantage light aa look at me
//                            // this command
//                             command:command,
//
//                             value: body.value
//                             // value: evt[4]
//                         };
//
//
//                         request(request_options,function(error, response, body){
//
//                             console.log('Sent status change to SmartThings for:'+ o.name+' Response:'+JSON.stringify(body));
//
//
//
//
//                         });
//                         //
//                     }
//                 }
//
//
//             });
//
//
//
//
//         } else
//         {
//             console.log('unknown sendto:'+sendto)
//
//         }
//
//
//
//     } else {
//
//         console.log ('command not found:'+command)
//         console.log ('object:'+obj.name)
//     }
//
//
// };

exports.mapExternalPorts = function(callback){
    var pmp = require('pmp');

    pmp.findGateway("",function(err,gateway) {
        if (err) {
            console.log('Gateway not found', err);
        }
        else {
            console.log('gateway found: '+ gateway.ip + ", External IP: "+ gateway.externalIP);
// updated 0 to 999999 7/8/2016
            pmp.portMap(gateway,8282,8282,999999,'webservertheater',function(err,rslt){
                if (err) {
                    console.log('error opening port 8282', err);
                }
                else {
                    // updated 0 to 999999 7/8/2016
                    pmp.portMap(gateway, 8280, 8280, 999999, 'websocktheater', function (err, rslt) {
                        if (err) {
                            console.log('error opening port 8280', err);
                        }
                        callback(gateway.externalIP);

                    });
                }
            });
        }
    });



};

