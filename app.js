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

app.get('/', function(request, response) {
    var opts = {};
    if (request.query.apitoken && request.query.projectid) {
        
        opts = { 'apitoken': request.query.apitoken, 'projectid': request.query.projectid };
    } else {
        opts = { 'apitoken': '0', 'projectid': '0' };

    }
    response.render('index', opts);
});

app.post('/post/', function(request, response) {
    var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';
    var apikey = request.body.apikey;

    var projectid = request.body.projectid;

    var cred = "Token " + apikey;
    var projectdetails = baseurl + projectid + '/';
    var systems = baseurl + projectid + '/systems/';
    var diagrams = baseurl + projectid + '/diagrams/';
    var cteams = baseurl + projectid + '/cteams/';
    var members = baseurl + projectid + '/members/';

    var URLS = [projectdetails, systems, diagrams, cteams, members];

    async.map(URLS, function(url, done) {
        req({
            url: url,
            headers: {
                "Authorization": cred,
                "Content-Type": "application/json"
            }
        }, function(err, response, body) {
            if (err || response.statusCode !== 200) {
                return done(err || new Error());
            }
            return done(null, JSON.parse(body));
        });
    }, function(err, results) {

        if (err) return response.sendStatus(500);
        response.contentType('application/json');
        response.send({
            "status": 1,
            "results": results
        });
    });
});

app.listen(process.env.PORT || 5000);