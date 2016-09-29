var eventhistory = [];

function eventselected(e){
    websocketsend('rules',{instruction:'lookuprule',id:o.id,events:e.value});
    document.getElementById("selectedruledisplay").value='';
    document.getElementById("selectedthingdisplay").value='';

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


    }
    console.log(newrule)
    websocketsend('rules',{instruction:'newrule',rule:newrule});

}

function buttondeleterule(){
    websocketsend('rules',{instruction:'deleterule',rule:rules[document.getElementById('rulelist').value]});
}

function buttonduplicaterule(){
    websocketsend('rules',{instruction:'duplicaterule',rule:rules[document.getElementById('rulelist').value]});
}
function displayevents(){
    document.getElementById("eventsforthisdevice").value=JSON.stringify(eventhistory[0],null,4);


}
function ruleclicked(e){
    document.getElementById("selectedruledisplay").value=JSON.stringify(rules[e.value],null,4);
    document.getElementById("selectedthingdisplay").value=JSON.stringify(getthingbyid(rules[e.value].id),null,4);


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
function populateeventlist(e){
    o = things[e.value];
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
        }if(x.object == "refreshrules"){
            // if we add or delete or modify a rule the server tells us its done and then we ask it to refresh the info
            websocketsend('rules',{instruction:'lookuprule',id:o.id,events:document.getElementById('eventlist').value});

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