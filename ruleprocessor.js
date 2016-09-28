exports.event = function(obj,event,eventdata,source){
    console.log('ruleprocessor id:'+obj.id+' event:'+event +'eventdata:'+JSON.stringify(eventdata));


         db.collection('rules').find({"id":obj.id,$or:[{"event":'all'},{"event":obj.event}],$or:[{"source":'any'},{"source":source}]}).toArray(function(err,rules){
         if (err){
            console.log('error search rules database');
            return;
        }
        console.log('rules found:'+rules.length)

        rules.forEach(function(rule){
            var oktoruncommands =true;
            if (rule.timerstrictions){
               console.log('evaluation time restrings here')
           }

           if (rule.conditions){
                console.log('evaluating:'+rule.conditions);
                if (typeof(rule.conditions == "string")){
                   oktoruncommands =eval(rule.conditions);
                }



            }
        console.log('oktorun:'+oktoruncommands);
           if (rule.commandstoexecute && oktoruncommands){
               console.log('Commands to execute');
               rule.commandstoexecute.forEach(function(cmd){

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

     });












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
}
