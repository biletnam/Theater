var eventhistory = [];

function buttonshowpastevents(){
    websocketsend('rules',{instruction:'showpastevents',id:o.id});


}
function incomingeventlistclicked(e){
    document.getElementById("selectedeventdisplay").value=JSON.stringify(eventhistory[e.value],null,4);


    JSON.stringify( document.getElementById("selectedeventdisplay").value)

}
function displayincomingevents(){
    sel = document.getElementById("incomingeventlist");
    removeOptions(sel);
    for (var i = 0; i < eventhistory.length; i++) {

        var el = document.createElement("option");
        // todo add more detail and better formating
        el.textContent = eventhistory[i].event+' ('+eventhistory[i].val+') '+eventhistory[i].source;
        el.value = i;
        sel.appendChild(el);


    }
}
function buttonsimulateevent(){
    websocketsend('rules',{instruction:'runevent',event:JSON.parse( document.getElementById("selectedeventdisplay").value)});
    //  websocketsend('rules',{instruction:'runevent',event:eventhistory[document.getElementById('incomingeventlist').value]});



}
function eventselected(e){
    websocketsend('rules',{instruction:'lookuprule',id:o.id,events:e.value});
    document.getElementById("selectedruledisplay").value='';


}
function buttonsaverulechanges(){
    saveselectedrule = document.getElementById("rulelist").value;
    //console.log('saveselectedrule:'+saveselectedrule)
    websocketsend('rules',{instruction:'saverule',rule:JSON.parse(document.getElementById('selectedruledisplay').value)});

}
function buttonnewrule(){
    //move selected item to botton of rules list
    saveselectedrule = rules.length;
    var selecteventtype = document.getElementById("eventlist").value;

    if (selecteventtype == 'any' || selecteventtype == 'all'){
        selecteventtype ='all';
    } else {

        selecteventtype = o.events[document.getElementById("eventlist").value].event;
    }
    //console.log('saveselectedrule:'+saveselectedrule)
    var newrule = {
        id:things[document.getElementById("selectedthing").value].id,
        event:selecteventtype,
        source:'any',
        description:"New Rule for "+o.name,
        conditions:[""],
        commandstoexecute:[{}]
    };
    console.log(newrule)
    websocketsend('rules',{instruction:'newrule',rule:newrule});

}

function buttondeleterule(){
    websocketsend('rules',{instruction:'deleterule',rule:rules[document.getElementById('rulelist').value]});
    document.getElementById("selectedruledisplay").value = '';
}

function buttonduplicaterule(){
    websocketsend('rules',{instruction:'duplicaterule',rule:rules[document.getElementById('rulelist').value]});
}
function displayevents(){
    document.getElementById("eventsforthisdevice").value=JSON.stringify(eventhistory[0],null,4);


}
function ruleclicked(e){
    document.getElementById("selectedruledisplay").value=JSON.stringify(rules[e.value],null,4);


}
function populateruleslist(){
    var includeevent = false;
    if ( document.getElementById("eventlist").value == 'any')
    {
        includeevent = true
    }
    sel = document.getElementById("rulelist")
    removeOptions(sel)

    for (var i = 0; i < rules.length; i++) {

        var el = document.createElement("option");
        if (includeevent){
            el.textContent = rules[i].description +' ('+rules[i].event +')';
        }else
        {
            el.textContent = rules[i].description ;
        }

        el.value = i;
        sel.appendChild(el);


    };
    //console.log('@pup rul'+saveselectedrule)
    if (saveselectedrule){
        document.getElementById("rulelist").value=saveselectedrule;
        ruleclicked(document.getElementById("rulelist"));
        saveselectedrule = ''
    }

}

function populatecommandlist(e){
    // command object
    co = things[e.value];
    if (!co.events){co.events ={}}
    sel = document.getElementById("commandlist")
    removeOptions(sel)

    if (co.commands){

        for (var i = 0; i < co.commands.length; i++) {
            var el = document.createElement("option");
            el.textContent = co.commands[i].name;
            el.value = i;
            sel.appendChild(el);
        }


    }
    // this will fill the viewcommand box
    commandclicked();
    // go ahead and show everything

};
function commandclicked(){
    e = document.getElementById("commandlist");
    document.getElementById("viewcommand").value = JSON.stringify(co.commands[e.value],null,4);


}
function buttonruncommand(){
    // todo add delay field
    websocketsend('rules',{instruction:'runcommand',obj:co,command:JSON.parse( document.getElementById("viewcommand").value),
        value: document.getElementById("commandvalue").value,delay:0});
    //  websocketsend('rules',{instruction:'runevent',event:eventhistory[document.getElementById('incomingeventlist').value]});



}
function populateeventlist(e){
    o = things[e.value];
    document.getElementById("selectedthingdisplay").value=JSON.stringify(o,null,4);

    if (!o.events){o.events ={}}
    sel = document.getElementById("eventlist")
    removeOptions(sel)

    var el = document.createElement("option");
    el.textContent = 'Show Everything';
    el.value = 'any';
    sel.appendChild(el);

    var el = document.createElement("option");
    el.textContent = 'all';
    el.value = 'all';
    sel.appendChild(el);

    if (o.events){

        for (var i = 0; i < o.events.length; i++) {
            var el = document.createElement("option");
            el.textContent = o.events[i].event+' - '+o.events[i].description;
            el.value = i;
            sel.appendChild(el);
        }


    }
    // go ahead and show everything
    document.getElementById("selectedthingdisplay").value=JSON.stringify(o,null,4);

    if (ws){
        // console.log('eventse')
        eventselected(document.getElementById("eventlist"));
    }
};



function websockstart(){
    ws = new ReconnectingWebSocket(wsUri);
    ws.onopen = function(evt){
        console.log("websocket connected")
    };
    ws.onmessage = function(evt) {

        var x = JSON.parse(evt.data);
        if (x.object == "settings.things"){
            things = x.data;
            //new things object - do something?
            //  location.reload();

        } else if(x.object == "matchingrules"){
            rules = x.data
            populateruleslist()
        }else if(x.object == "neweventformonitoringid"){
            //unshift is like push, but adds to the top
            eventhistory.unshift(x.data);
            displayevents();
            displayincomingevents();
        } else if(x.object == "refreshrules"){
            // if we add or delete or modify a rule the server tells us its done and then we ask it to refresh the info
            websocketsend('rules',{instruction:'lookuprule',id:o.id,events:document.getElementById('eventlist').value});

        } else if(x.object == "eventhistory"){
            eventhistory = x.eventhistory;
            //console.log(eventhistory);
            displayincomingevents();

        }else if(x.object == "popup"){
            alert(x.text);
        }
    };

}
function edititem(thingindex,prop){
    things[thingindex][prop]= prompt("New Value");
    thingselected(document.getElementById('selectedthing'));
    //things['+e.value+'].'+prop+'= prompt()


}
function addprop(){
    var newprop = prompt("Enter Name of New Property")
    //var newval = prompt("Enter Value")
    things[document.getElementById('selectedthing').value][newprop]= prompt("Enter Value")
    thingselected(document.getElementById('selectedthing'));

}


function websocketsend(type,data){

    var sendobj = {};
    sendobj.type = type;
    sendobj.data = data;
    ws.send(JSON.stringify(sendobj));

}

function removeOptions(selectbox)
{
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
    {
        selectbox.remove(i);
    }
}
function getthingbyid (inid){
    var returnvalue = false;
    things.some(function(e){
        if (e.id == inid){
            returnvalue = e;
            return true;
        }
    });

    return returnvalue;
};
function buttonnaddtorule(){
//grab the rule from the textbox and convert it to an object

    var appendedrule = JSON.parse(document.getElementById('selectedruledisplay').value)
    var command = JSON.parse( document.getElementById("viewcommand").value);
    appendedrule.commandstoexecute.unshift({id:co.id,name:command.name,value:document.getElementById("commandvalue").value,delay:0});
    document.getElementById("selectedruledisplay").value=JSON.stringify(appendedrule,null,4);
}
function buttonnewcommand(){
    var name = prompt("Enter Command Name");
    var ncmd = {name:name,desciption:"Enter a clear description of the command",sendto:"",command:"",valuedescription:"Enter the values this command takes"}
    co.commands.push(ncmd); // add this to the commands list
    websocketsend('rules',{instruction:'savecommands',id:co.id,commands:co.commands});
    // update things with the new command
    things[document.getElementById("selectedthingcommand").value].commands = co.commands;
    populatecommandlist(document.getElementById("selectedthingcommand"));
    document.getElementById("commandlist").value = co.commands.length-1;
    commandclicked();
}
function buttonsavecommand(){
    // grab the info from the command box and make it an object
    var command = JSON.parse( document.getElementById("viewcommand").value);
    //put the new object into the command array
    co.commands[document.getElementById("commandlist").value] = command
    // save it
    websocketsend('rules',{instruction:'savecommands',id:co.id,commands:co.commands});
}
function buttondeletecommand(){
    // delete the item out of the things.commands array
    things[document.getElementById("selectedthingcommand").value].commands.splice(document.getElementById("commandlist").value,1);
    co =things[document.getElementById("selectedthingcommand").value];

    websocketsend('rules',{instruction:'savecommands',id:co.id,commands:co.commands});
    // update things with the new command
    //  things[document.getElementById("selectedthingcommand").value].commands = co.commands;
    populatecommandlist(document.getElementById("selectedthingcommand"));
    document.getElementById("commandlist").value = co.commands.length-1;
    commandclicked();
}