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
exports.executecommand = function(obj,command,value,delay){
    if (delay){
        setTimeout(function(obj,command,value){ll.executecommand(obj,command,value)},delay,obj,command,value);


        console.log('delay command');
        return;
    }
    console.log('exec command');

    if (typeof(obj) != "object"){
        obj=this.getthingbyid(obj);


    }



    var cmd = false;

    console.log("execute command:"+command+" val:"+value+' name:'+obj.name);
    obj.commands.some(function(e) {
        if (e.name == command) {
            cmd = e;
            return true;
        }


    });
    if (cmd){
        if (cmd.sendto == 'vantage'){
            serial.write(cmd.command.replace("{value}",value));

        } else if (cmd.sendto == "smartthings"){
//
            var request_options = {
                headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
            };
            request_options.uri = stsettings.restUri+ '/update';
            request_options.json = {
                id: obj.stid,// vantage light aa look at me
                command: command,
                value: Number(value)
            };
            request(request_options,function(error, response, body){
                console.log('command sent to StartThings');
            });

            //

        } else if (cmd.sendto == "logitec-harmony"){

            console.log('command sent to harmony');
            hc.sendcommand2(cmd.command);





        } else if (cmd.sendto == "RGBLED")
        {
            console.log(cmd)
            request_options = {}
            request_options.uri = cmd.sendtoaddress;
            request_options.json = cmd.command;
            request_options.json.led = 2
            request_options.json.value = value;
            request_options.json.obj = obj;


            request(request_options,function(error, response, body){
                // mayby the
                if (body){
                    console.log('command sent to RGBLED');
                    console.log(body.command);
                    var o = body.obj;
                    if (o.issmartthingchild) {
                        //
                        var request_options = {
                            headers: { Authorization: 'Bearer ' + settings.stsettings.smartthingsoauthtoken}
                        };
                        request_options.uri = stsettings.restUri+ '/update';
                        request_options.json = {
                            id: o.stid,// vantage light aa look at me
                           // this command
                            command:"setlevel",

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



    } else {

        console.log ('command not found:'+command)
        console.log ('object:'+obj.name)
    }


};



