var express = require("express");
var req = require('request');
var async = require('async');
var bodyParser = require('body-parser');
var app = express();
var ejs = require('ejs');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())

var baseurl = 'http://local.test:8000/api/v1/projects/';
var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';

app.get('/', function (request, response) {
    
    if (request.query.apitoken && request.query.projectid) {

        var apikey = request.query.apikey;
        var projectid = request.query.projectid;

        var cred = "Token " + apikey;
        var projectdetails = baseurl + projectid + '/';
        var systems = baseurl + projectid + '/systems/';
        var diagrams = baseurl + projectid + '/diagrams/';
        var cteams = baseurl + projectid + '/cteams/';
        var members = baseurl + projectid + '/members/';

        var URLS = [projectdetails, systems, diagrams, cteams, members];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {

            if (err) return response.sendStatus(500);

            response.render('index', {
                "status": 1,
                "data": results
            });
        });

    } else {
        response.status(400).send('Not all parameters supplied.')

    };
});

app.get('/diagrams', function (request, response) {
    
    if (request.query.apitoken && request.query.projectid) {

        var apikey = request.query.apikey;
        var projectid = request.query.projectid;
        
        var cred = "Token " + apikey;
        var projectdetails = baseurl + projectid + '/';
        var systems = baseurl + projectid + '/systems/';
        var diagrams = baseurl + projectid + '/diagrams/';
        var cteams = baseurl + projectid + '/cteams/';
        var members = baseurl + projectid + '/members/';

        var URLS = [projectdetails, systems, diagrams, cteams, members];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {

            if (err) return response.sendStatus(500);

            response.render('diagrams', {
                "status": 1,
                "data": results
            });
        });

    } else {
        response.status(400).send('Not all parameters supplied.')

    };
});

app.listen(process.env.PORT || 5000);