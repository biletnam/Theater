/**
 * Created by todd on 11/4/2015.
 */
global.settings ={};
var fs = require('fs');
// fs.readFile("settings.json", 'utf8', function(err, data) {
//     if (err) throw err;
//     //console.log('OK: ' + filename);
//
//     console.log(data)
//     settings = JSON.parse(data);

//});

var debug   = require('debug')('http');

// Application Configuration
var config = {
    port: process.env.PORT || 8100,
    api_root: 'https://graph.api.smartthings.com',
    server_address: '68.104.0.250:8100',
    oauth: {
        clientID: '9caee22f-7595-45a8-b9d4-c3fc279a01e2',
        clientSecret: 'a9dfaafc-9779-4f4d-88f0-fd8bb866d154',
        site: 'https://graph.api.smartthings.com',
        tokenPath: '/oauth/token'
    }
}

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
        settings.token = token.token.access_token;

        // setup request options with uri to get this app's endpoints
        // and add retrieved oauth token to auth header
        var request_options = {
            uri: config.api_root+'/api/smartapps/endpoints',
            headers: { Authorization: 'Bearer '+token.token.access_token }
        }
            settings.smartthingsoauthtoken=token.token.access_token;
        request(request_options, function(error, response, body) {
            if (error) { console.log('Endpoints Request Error', error); }

            // extract the app's unique installation url
            var installation_url = JSON.parse(body)[0]['url'];
            settings.restUri =  config.api_root+installation_url;
            console.log('installation_url'+settings.restUri);
            // reuse request options with new uri for the "things" endpoint
            // specific to this app installation
            request_options.uri = config.api_root + installation_url + '/things'
            console.log('request_options.uri:'+request_options.uri);
            request(request_options, function(error, response, body){
                var all_things = JSON.parse(body);
                settings.things = all_things;

                res.json(settings); // send JSON of all things
                fs.writeFile("settings.json", JSON.stringify(settings), function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("Settings saved to disk!");
                });


            });
        });
    });
});

app.listen(config.port, function() {
    console.log('Server running on port', config.port);
});