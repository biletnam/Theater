/**
 * Created by todd on 3/14/2016.
 */


var request = require('request');



    stsettings = settings.stsettings;
    console.log('Loaded smartthings settings from file') // possible move this to be from the settings database
    console.log('Smartthings Authorization Token:'+stsettings.token);
    console.log('Smartthings Rest Uri:'+stsettings.restUri)

    //console.log('settings:'+JSON.stringify(stsettings.things.devices[0]));
    //console.log('settings:'+stsettings.things.devices.length);

exports.addchild = function(obj){

    if (obj.id ){
        // tell smarthings to add the child

        var request_options = {
            headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
        };

        request_options.uri = stsettings.restUri + '/createchild';
        request_options.json = {
            //type:"Virtual Temp",
            type: obj.type,
            name: obj.name,
            nameSpace: obj.namespace,
            label: obj.name,
            nid: obj.id
        };


        request(request_options,function(error, response, data){
            //console.log('addchild '+stsettings.url,error);
            if (data.newdevice){
                console.log("Added NEW Child Device")
            } else
            {
                console.log("Existing Child Device Found:"+data.nid)
            }
            if (data.type == "addchilddevice"){
                var o = ll.getthingbyid(data.nid);
                o.stid = data.id;
                o.issmartthingchild = true;
                ll.writething(o,true);
                return;
            }


        });




    }
};
exports.stEvent =function(data){

     //console.log(data);


    if (data.id){ // received something with and id
        // check to see if we can find the object
        var o = ll.getthingbystid(data.id); // look up the child by smarthings ID
        if (o){
            // found the object in the database
            console.log('Command from SmartThings for thing:'+ o.name);
            if(o.issmartthingchild){
                // child objject execute command
                console.log('data.command:'+data.command);
                console.log('data.value:'+data.value);

                ll.executecommand(o,data.command,data.value);
                //serial.write("VLC 1 65 1 0 0\r");

            } else{
                // not a child so incoming is a status change
                //console.log("data from smartthings (not a child)"+JSON.stringify(data));
                // check to see if this device is reporting for an other device

                if (o.reporttodeviceid){
                    //switching objects for reporting
                    var tempname = o.name;
                    o = ll.getthingbyid(o.reporttodeviceid);
                    console.log('Data from '+tempname+' is being reporting to device:'+ o.name);

                }
                /*
                 // check to see if this device is using power as an switch




                 */
                if (o.determinestatefrompower && data.name =="power"){
                    //send a fake on/off event is the currentstate should change
                    if (data.value >= o.powerthreshold && o.currentstate == 0){
                        // if the reported power is higher than the threshhold and the state is off
                        // turn it on
                        console.log("turned on by watts used")
                        o.currentstate = 100;
                        o.currentstatetime = new Date();
                        // was off now on - make a new record in the log
                        var li = {}; // init the loginfo var
                        li.id = o.id;
                        li.ontime = new Date();
                        li.events =[];
                        li.events[0] = {time: new Date(),state: 1,power: data.value};
                        li.closed = false;
                        li.watthours = 0;

                        db.collection('log').insertOne(li,function(err,rslt){
                            if (!err){
                                console.log ('inserted on new event (from power)'+ o.name);
                            }
                        });
                        o.currentstate =100;
                        o.currentstatetime = new Date();
                        ll.writething(o,true);
                        return;

                    } else
                    if (data.value < o.powerthreshold && o.currentstate > 0) {
                        // if the reported power is lower than the threshhold and the state is on
                        // turn it off
                        console.log("turned off by watts used")
                        o.currentstate = 0;
                        o.currentstatetime = new Date();

                        //??--
                        // find open record in the log
                        db.collection('log').find({$and : [{id: o.id},{closed:false}]}).sort({ontime: -1}).limit(1).toArray(function(err,li){
                            li = li[0];
                            if (li) {
                                var id = new require('mongodb').ObjectID(li._id);
                                //console.log('found already on object'+JSON.stringify(li));
                                li.closed = 'true';
                                li.offtime = new Date();
                                li.onminutes = (new Date() - li.ontime.getTime()) / 60000;

                                // time since last event in hours * (loadwatts*lastlevel%)
                                if (o.loadwatts>0){
                                    // use estimated watts
                                    li.watthours = li.watthours + ((new Date() - li.events[li.events.length - 1].time.getTime()) / 3600000)
                                        * (o.loadwatts );

                                }else{
                                    // use power reported watts

                                    li.watthours = li.watthours + ((new Date() - li.events[li.events.length - 1].time.getTime()) / 3600000)
                                        * (li.events[li.events.length - 1].power);

                                }




                                if ("totalontime" in o) {
                                    o.totalontime = o.totalontime + li.onminutes;
                                    o.kwhours = o.kwhours + (li.watthours / 1000);
                                    console.log("Total on time for "+ o.name+" :" + o.totalontime+ " added:"+li.onminutes);


                                }

                                li.events.push( {time: new Date(),state: 0,power: 0});
                                li.avgpower = li.watthours/(li.onminutes/60) ;
                                db.collection('log').update({'_id': id}, li, function (err, res) {
                                    console.log('log event updated - event closed');
                                });
                                // update the thing with the info
                            }
                            o.switch = data.value;
                            o.currentstate =0;
                            //o.power = 0;
                            o.currentstatetime = new Date();

                            ll.writething(o,true);

                        });




                        // end off
                        //??--
                        return;


                    } else {
                        // just power reporting let the power function handle it



                    }








                }

                /*
                 // END check to see if this device is using power as an switch

                 */







                if (data.name == "power"){
                    //// just find the last record - even if its closed -- MAYBE I SHOULD JUST IGNORE IT IF IT IS CLOSED
                    db.collection('log').find({id: o.id}).sort({ontime: -1}).limit(1).toArray(function(err,li){
                        li = li[0];
                        if (li) {

                            var id = new require('mongodb').ObjectID(li._id);
                            //console.log('found already on object'+JSON.stringify(li));
                            // time since last event in hours * (loadwatts*lastlevel%)
                            li.watthours = li.watthours + ((new Date() - li.events[li.events.length - 1].time.getTime()) / 3600000)
                                * li.events[li.events.length - 1].power;
                            //   console.log("watthours"+li.watthours)


                            li.events.push({time: new Date(), state: o.currentstate, power: data.value});
                            db.collection('log').update({'_id': id}, li, function (err, res) {
                                console.log('log event updated');
                            });

                        }
                    });

                    // update the thing with the info
                    /////
                    o.currentreportedpower = data.value;
                    o.currentreportedpowertime = new Date();

                    ll.writething(o,true);

                } else
                if (data.name == "energy"){
                    o.kwhours = data.value;
                    console.error("energy"+data.value);
                    ll.writething(o,true);
                } else
                if (data.name == "switch"){
                    if (!o.currentstate  && data.value == "on"){
                        // was off now on - make a new record
                        var li = {}; // init the loginfo var
                        li.id = o.id;
                        li.ontime = new Date();
                        li.events =[];
                        li.events[0] = {time: new Date(),state: 1,power: 0};
                        li.closed = false;
                        li.watthours = 0;

                        db.collection('log').insertOne(li,function(err,rslt){
                            if (!err){
                                console.log ('inserted new event '+ o.name);
                            }
                        });
                        o.switch = data.value;
                        o.currentstate =100;
                        o.currentstatetime = new Date();
                        ll.writething(o,true);

                    } else if (o.currentstate && data.value =="off"){
                        // was on now off
                        db.collection('log').find({$and : [{id: o.id},{closed:false}]}).sort({ontime: -1}).limit(1).toArray(function(err,li){
                            li = li[0];
                            if (li) {
                                var id = new require('mongodb').ObjectID(li._id);
                                //console.log('found already on object'+JSON.stringify(li));
                                li.closed = 'true';
                                li.offtime = new Date();
                                li.onminutes = (new Date() - li.ontime.getTime()) / 60000;

                                // time since last event in hours * (loadwatts*lastlevel%)
                                li.watthours = li.watthours + ((new Date() - li.events[li.events.length - 1].time.getTime()) / 3600000)
                                    * (li.events[li.events.length - 1].power);

                                if ("totalontime" in o) {
                                    o.totalontime = o.totalontime + li.onminutes;
                                    o.kwhours = o.kwhours + (li.watthours / 1000);
                                    console.log("Total on time for "+ o.name+" :" + o.totalontime+ " added:"+li.onminutes);


                                }

                                li.events.push( {time: new Date(),state: 0,power: 0});
                                li.avgpower = li.watthours/(li.onminutes/60) ;
                                db.collection('log').update({'_id': id}, li, function (err, res) {
                                    console.log('log event updated - event closed');
                                });
                                // update the thing with the info
                            }
                            o.currentstate =0;
                            o.currentstatetime = new Date();

                            ll.writething(o,true);

                        });




                        // end off
                    }


                    ///////////////////////////

                }
            }




        }else {
            // didn't find the object in the database
            // id not found
            // refresh the database from smartthings data
            module.exports.addthingsfromst();


        }



//           console.log('here id:'+data.id);
//           if (data.id == "3e31910e-b979-47ab-bf67-693701986964" ){
//    // tell smarthings the request worked
//
//               var request_options = {
//                   headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
//               };
//               request_options.uri = stsettings.restUri+ '/update';
//               request_options.json = {
//                   id:data.id,// vantage light aa look at me
//                   command: data.command,
//                   value: data.value
//               };
//
//
//               request(request_options,function(error, response, body){
//
//               console.log('updated smarthings')
//
//
//
//           });
//
//
//       }

    }





    if (data.device == 'Water Heater' && data.name == 'power'){
//        console.log (data.value);
        if (data.value > 10 ){

            if (waterheater.on == false){
                waterheater.on = true;
                waterheater.ontime = new Date();
                waterheater.wattseconds = 0;
                waterheater.isshower = false; // reset the shower var
                waterheater.lastpowerreading = waterheater.ontime;
                waterheater.lastpower = data.value;
                process.stdout.write("Waterheater on @"+Date()+"\r");


                //console.log("waterheater turned on");

            } else {
                // waterheater on and using more than 7 watts

                //   console.log("Waterheater still on using "+data.value+" watts ontime:"+(new Date()-waterheater.ontime.getTime())/1000);
                //every packet where happens when that waterheater is on - calculate power used

                var ontimeseconds = (new Date()-waterheater.lastpowerreading.getTime())/1000;
                waterheater.wattseconds = waterheater.wattseconds+(ontimeseconds*waterheater.lastpower);
                waterheater.lastpowerreading = new Date();
                waterheater.lastpower = data.value;
                process.stdout.write("Last power reading " + data.value + " @"+Date()+"\r");

            }



        } else


        {
            // waterheater off
            if (waterheater.on){

                // add the last power used - cause why not

                var ontimeseconds = (new Date()-waterheater.lastpowerreading.getTime())/1000;
                waterheater.wattseconds = waterheater.wattseconds+(ontimeseconds*waterheater.lastpower);
                waterheater.onminutes = (new Date()-waterheater.ontime.getTime())/60000;
                //  console.log ('Wattseconds used:'+waterheater.wattseconds);
                waterheater.on = false;
                waterheater.offtime = new Date();
                // using 0.9195967741935484 dollars per 100 cf (jan 2016 bill)
                // use rate 2.72 cf Min - this is the highest range seems to be 1.875 to 2.72 cf /min
                // (22-32 seconds per cubit foot)

                waterheater.gascost = 0.0250130322580645 *  waterheater.onminutes;


                // let's see if we can figure out who
                if (waterheater.onminutes > 9){  // more than 5 min - guessing its a shower
                    waterheater.isshower = true;
                    var starttime = waterheater.ontime.getHours()+(waterheater.ontime.getMinutes()/60); // starttime in decimal hours
                    var dow =  waterheater.ontime.getDay();// 0 = sun

                    waterheater.showeruser = "";
                    if (starttime > 5 && starttime < 6 && dow != 0 && dow != 6){ // between 5 and 6am
                        waterheater.showeruser = "CASEY";
                    } else
                    if (starttime > 6 && starttime < 6.33 && dow == 5){ // between 6 and 6:20am on fridays
                        waterheater.showeruser = "TJ";
                    } else
                    if (starttime > 6.1 && starttime < 6.75 && dow != 0 && dow != 6 ){ // between 6 and 6:20am
                        waterheater.showeruser = "JJ";
                    } else

                    if (starttime > 7 && starttime < 8 && dow != 0 && dow != 6){ // between 6 and 6:20am
                        waterheater.showeruser = "TJ";
                    } else
                    if (starttime > 8 && starttime < 14 && dow != 0 && dow != 6){ // between 6 and 6:20am
                        waterheater.showeruser = "TODD";
                    }


                }





                console.log(new Date()+ "-waterheater turned off - on for "+waterheater.onminutes.toFixed(2)+ ' Cost:'+waterheater.gascost.toFixed(3));
                delete waterheater.lastpower;
                delete waterheater.lastpowerreading;
                delete waterheater.on;
                waterheater.khw = (waterheater.wattseconds/3600000); // 3600 SECS PER hour * 1000 watts/ kw
                delete waterheater.wattseconds;
                //dump it in the databases
                db.collection('waterheater').insertOne(waterheater,function(err,rslt){
                    delete waterheater._id;
                    waterheater.on = false;

                    if (!err){

                        console.log("water record saved:")
                    }else
                    {
                        console.log("error inserting record:"+err)
                    }


                });

            }


        }

    } else
    {

        console.log (data.device,data.value);

    }


}

/****

 @ therostat of 115

 full hot water 22-32  sec / cubic foot    2.72 CF /Min  $ per min 0.0250130322580645   @ 1.875 CF/Min = $per min 0.017242439516129
 kids shower 26 - 41 sec / CF

 furnace 62 seconds / per cf (58 cf / per hour or .53 cents per hour)

 0.9195967741935484 dollars per 100 cf (1/2016 bill)

 ***/
exports.addthingsfromst = function (){
// get the things smart smartthings and make sure they are in the local database


// get all the things from smartthings
console.log('Updating the Things database ...');
console.log('Request all controlled objects from Smartthings ...')

    var request_options = {
        headers: { Authorization: 'Bearer ' + stsettings.smartthingsoauthtoken}
    };

    request_options.uri = stsettings.restUri + '/things';
    request(request_options,function(error, response, data){
        console.log('Recieved data back from Smartthings - processing ...')
        var s =  JSON.parse(data);

        s.devices.forEach(function(e){
              console.log(JSON.stringify(e));
            ll.writething(e,true,true);

        });


    });
};
