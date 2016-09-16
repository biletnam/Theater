/**
 * Created by todd on 11/4/2015.
 */
global.settings ={};
ll = require('./llib.js');
ll.startmongo('theatersettings',mongostarted);
function mongostarted(returnedsettings){
    global.settings = returnedsettings;
}


//var fs = require('fs');
// fs.readFile("settings.json", 'utf8', function(err, data) {
//     if (err) throw err;
//     //console.log('OK: ' + filename);
//
//     console.log(data)
//     settings = JSON.parse(data);

//});

var debug   = require('debug')('http');

// Application Configuration
/*

            CONFIG STEVE

 */
var steveconfig = {
    port: process.env.PORT || 8100,
    api_root: 'https://graph.api.smartthings.com',
    server_address: 'http://68.104.0.250:8100',
    oauth: {
        clientID: '005e9c5b-4d6b-4c3e-b3f2-7f2318ccfca9',
        clientSecret: 'd94e0a64-ae66-414b-b0dd-493a22fd4ec4',
        site: 'https://graph.api.smartthings.com',
        tokenPath: '/oauth/token'
    }
}
/*

            CONFIG TODD

 */
var toddconfig = {
    port: process.env.PORT || 8100,
    api_root: 'https://graph.api.smartthings.com',
    server_address: 'http://level451.com:8100',
    oauth: {
        clientID: 'a79c4cfa-1ad6-4da9-a858-a8ed2436af42',
        clientSecret: '34554b8c-f843-4e5d-81f7-362c6fa73d27',
        site: 'https://graph.api.smartthings.com',
        tokenPath: '/oauth/token'
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////////
// set config here
var config = steveconfig
//var config = toddconfig
console.log('Goto this website:'+ config.server_address)
/////////////////////////////////////////////////////////////////////////////////////////////////




var express = require('express');
var request = require('request');
var oauth2  = require('simple-oauth2')(config.oauth);

// create auth uri for SmartThings
var authorization_uri = oauth2.authCode.authorizeURL({
    redirect_uri: config.server_address+'/callback',
    scope: 'app'
});

var app = express();

app.get('/', function (req, res) {
    res.send('<a href=/auth>Login with SmartThings</a>');
});

app.get('/auth', function (req, res) {
    // redirect to SmartThings auth uri
    console.log(authorization_uri)
    res.redirect(authorization_uri);
});
var stsettings = {}


app.get('/callback', function (req, res) {
    // parse request from SmartThings and get access token
    var code = req.query.code;
     if (req.query.code == undefined ){
         res.send("Authorization Denied");
         return;
     }
    oauth2.authCode.getToken({
        code: code,
        redirect_uri: config.server_address + '/callback'
    }, function (error, result) {
        if (error) { console.log('Access Token Error', error); }

        // extract auth token
        var token = oauth2.accessToken.create(result);
        console.log('token:'+token.token.access_token);
        stsettings.token = token.token.access_token;

        // setup request options with uri to get this app's endpoints
        // and add retrieved oauth token to auth header
        var request_options = {
            uri: config.api_root+'/api/smartapps/endpoints',
            headers: { Authorization: 'Bearer '+token.token.access_token }
        }
            stsettings.smartthingsoauthtoken=token.token.access_token;
        request(request_options, function(error, response, body) {
            if (error) { console.log('Endpoints Request Error', error); }

            // extract the app's unique installation url
            var installation_url = JSON.parse(body)[0]['url'];
            stsettings.restUri =  config.api_root+installation_url;
            console.log('installation_url'+stsettings.restUri);
            // reuse request options with new uri for the "things" endpoint
            // specific to this app installation
            request_options.uri = config.api_root + installation_url + '/things'
            console.log('request_options.uri:'+request_options.uri);
            request(request_options, function(error, response, body){
                var all_things = JSON.parse(body);
                stsettings.things = all_things;

                res.json(stsettings); // send JSON of all things

                    // update settings and save (mongo)
                settings.stsettings = stsettings;
                ll.savesettings();


                // fs.writeFile("settings.json", JSON.stringify(settings), function(err) {
                //     if(err) {
                //         return console.log(err);
                //     }
                //
                //     console.log("Settings saved to disk!");
                // });


            });
        });
    });
});

app.listen(config.port, function() {
    console.log('Server running on port', config.port);
});