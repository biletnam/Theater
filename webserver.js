/**
 * Created by todd on 3/1/2016.
 */
exports.start = function(callback) {
    var express = require('express');

    var  app = express();
    var ejs = require('ejs');
    var bodyParser = require('body-parser');

    app.use(express.static('public')); // set up the public directory as web accessible

    app.use(function(err, req, res, next) {
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });

    app.get('/', function (req, res) {
        res.render('home.ejs', { title: 'Home' });
    });
    app.get('/test', function (req, res) {
        res.render('test.ejs');
    });
    app.get('/things', function (req, res) {
        res.render('things.ejs',{things:global.settings.things});
    });

    app.get('/shower', function (req, res) {

        db.collection('waterheater').find({isshower: true}).sort({"ontime": -1}).limit(100).toArray(function(err,rslt){
            //console.log(rslt[0]);
           //console.log(s);
            res.render('waterheater.ejs', { title: 'LED',s:rslt });


        });

    });

    app.get('/cam', function (req, res) {
        var x = new Date();
        //console.log(webserver.formatDate(x))
    //    db.collection('log').find({ $and:[{"sd": {"$gte": new Date(x.getFullYear(),x.getMonth(),x.getDate()), "$lt": x}},
        db.collection('log').find({ $and:[{"ontime": {"$gte": new Date(x.getFullYear(),x.getMonth(),x.getDate()-1)}},
                {id:"axisfrontdoorcam"}]})
            .sort({"ontime": -1}).toArray(function(err,rslt){
          //  console.log(err,rslt[0]);
            console.log(axis.keywordfilter('test'));
            res.render('cam.ejs', { title: 'LED',events:rslt });


        });

    });


    app.post('/cam/upload',bodyParser.raw({ limit: '50mb',type: 'image/jpeg' }), function(req, res){
        //console.log(req.headers) // form fields
        axis.incomingaxisjpg(req);

        res.status(204).end()
    });



    app.use(function(req, res, next) {
        res.status(404).send('Sorry cant find that!');
    });

    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        //console.log('Http server listening at http://%s:%s', host, port);
       callback('Http server listening at http://'+host+':'+port);
    });




  exports.formatDate =  function(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        //  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
        return strTime;
    }




};