// this is the id of the selected device in the rule editor
var monitoringid = ''
exports.event = function(id,event,val,eventdata,source){

    o=ll.getthingbyid(id);
    console.log('ruleprocessor id:'+id+' event:'+event +'eventdata:'+JSON.stringify(eventdata));


    db.collection('rules').find({"id":id,$or:[{"event":'all'},{"event":event}],$or:[{"source":'any'},{"source":source}]}).toArray(function(err,rules){
        if (err){
            console.log('error search rules database');
            return;
        }

        console.log('rules found:'+rules.length)
        var rulesrun=[];
        rules.forEach(function(rule){
            var oktorunrule =true;
            if (rule.timerstrictions){
                console.log('evaluation time restrings here')
            }

            if (rule.conditions){
                console.log('evaluating:'+rule.conditions);
                if (typeof(rule.conditions == "string")){
                    oktorunrule =eval(rule.conditions);
                }
                // add iteration if conditions is an object


            }

            if (oktorunrule) {
                rulesrun.push(rule)
            }

            console.log('oktorun:'+oktorunrule);
            if (rule.commandstoexecute && oktorunrule){
                console.log('Commands to execute');
                rule.commandstoexecute.forEach(function(cmd)
                {

                    if (cmd.id){var o = ll.getthingbyid(cmd.id)}
                    else if (cmd.label) {var o = ll.getthingbylabel(cmd.label)}
                    if (o){
                        ll.executecommand(o,cmd.command,cmd.value,cmd.delay);
                    } else
                    {
                        console.log('object not found for '+rule.description)
                    }
                });

            }



            console.log("Desc:"+rule.description)



        });
        //log events here
        //Log the new event in the events collection
        var newevent = {
            time:new Date(),
            name:((o.label)? o.label:o.name),
            id:id,event:event,
            val:val,source:source,
            rulesevaluated:rules.length,
            rulesrun:rulesrun,
            eventdata:eventdata
        };
        db.collection('events').insertOne(newevent,function(err,rslt){
            if (!err){
                console.log ('inserted new event');

            }
        });
        if(monitoringid && id == monitoringid.id){

            websock.send(JSON.stringify({object:"neweventformonitoringid",data:newevent}),monitoringid.websocketid);


        }

    });

}
exports.inwebsocket = function(data,websocketid){
    // incomming websocket data from the rules page

    if (data.instruction){
        // could I make this any more complicated?
        switch(data.instruction){
            case "newrule":
                //console.log(JSON.stringify(data));
                db.collection('rules').insertOne(data.rule,function(err,rslt){
                    if(!err){
                        websock.send(JSON.stringify({object:"refreshrules"}),websocketid);
                    } else {
                        console.log('error create new rule '+err);
                    }


                });

                break;

            case "saverule":
                //console.log(JSON.stringify(data));
                // remove the unique mongo id so a new one is created
                data.rule._id=require('mongodb').ObjectID(data.rule._id)
                db.collection('rules').updateOne({_id:data.rule._id},data.rule,function(err,rslt){
                    if(!err){
                        websock.send(JSON.stringify({object:"refreshrules"}),websocketid);
                    } else {
                        console.log('error updating'+err);
                    }


                });

                break;

            case "deleterule":
                data.rule._id=require('mongodb').ObjectID(data.rule._id);

                db.collection('rules').removeOne({_id:data.rule._id},function(err,rslt){
                    if(!err){
                        websock.send(JSON.stringify({object:"refreshrules"}),websocketid);
                    } else {
                        console.log('error deleting'+err);
                    }
                });

                break;
            case "duplicaterule":
                // remove the unique mongo id so a new one is created
                delete data.rule._id
                db.collection('rules').insertOne(data.rule,function(err,rslt){
                    if(!err){
                        websock.send(JSON.stringify({object:"refreshrules"}),websocketid);
                    } else {
                        console.log('error duplicating'+err);
                    }
                });

                break;
            case "lookuprule":
                switch (data.events){
                    case "all":
                        var qs ={"id":data.id,"event":"all"}

                        break;
                    case "any":
                        var qs = {"id":data.id}

                        break;
                    default:

                        var qs ={"id":data.id,"event":ll.getthingbyid(data.id).events[data.events].event}



                }
                // if this var is not empty we send every event to this websocket
                monitoringid = {id:data.id,websocketid:websocketid};
                if (data.events){var event =data.events.event;} else {var event = "all"};

                db.collection('rules').find(qs).toArray(function(err,rules){
                    //passing id only return the data to the requesting websock
                    websock.send(JSON.stringify({object:"matchingrules",data:rules}),websocketid);

                    // console.log(JSON.stringify(rules));

                });

                break;

            default:
                console.log('unknown websocket rule instruction:'+data.instruction)



        }

    }




};










// ignore this stuff

// switch(source){
//     case "smartthings":
//
//         console.log('smartthings event:')
//         console.log(JSON.stringify(eventdata));
//         if (obj.id=='AC'){
//             if (eventdata.command =='Switch'){
//                 if(eventdata.value == 100) {
//                     console.log('turning on ac');
//                   // temporary - in future use last state.
//                     ll.executecommand(ll.getthingbyid("30329793"),"AC 70 f1");
//
//                 }else
//                 {
//                     console.log('turning off ac');
//                     ll.executecommand(ll.getthingbyid("30329793"),"Off");
//
//                 }
//
//
//             }
//
//
//
//
//         }
//       break;
//
//     default:
//
//
//
// }

