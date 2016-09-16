var request = require('request');
var request_options = {

};
request_options.uri = 'http://10.6.1.32:8201/';
request_options.json = {
    command: 'ledSetColor',
    r: '255',
    g: '255',
    b: '0',
    led: 1
};
request(request_options,function(error, response, body){
    console.log('command sent to RGBLED');
});
