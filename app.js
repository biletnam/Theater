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


    }
}
