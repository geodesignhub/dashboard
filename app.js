var express = require("express");
var req = require('request');
var async = require('async');
var bodyParser = require('body-parser');
var app = express();
var ejs = require('ejs');
app.set('view engine', 'ejs');
var axios = require('axios');
app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())

var baseurl = 'http://local.test:8000/api/v1/projects/';
// var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';

app.get('/', function (request, response) {

    if (request.query.apitoken && request.query.projectid) {

        var api_token = request.query.apitoken;
        var project_id = request.query.projectid;

        var cred = "Token " + api_token;

        var systems = baseurl + project_id + '/systems/';
        var diagrams = baseurl + project_id + '/diagrams/';

        var URLS = [systems, diagrams];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    if (response.statusCode == 429) {
                        return done(err || new Error("Too many requests from your profie"));
                    }
                    else {
                        return done(err || new Error());
                    }
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {

            if (err) return response.sendStatus(500);

            response.render('index', {
                "status": 1,
                "data": results,
                "api_token": api_token,
                "project_id": project_id
            });
        });

    } else {
        response.status(400).send('Not all parameters supplied.')

    };
});

app.get('/images/:diagram_id(\\d+)/:uuid?/', function (request, response) {
    let reqUUID = request.params.uuid;
    let diagram_id = request.params.diagram_id;
    const is_uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reqUUID);
    diagram_id = parseInt(diagram_id);
    const is_int = Number.isInteger(diagram_id);
    if (is_uuid && is_int) {
        var api_token = request.query.apitoken;
        var project_id = request.query.projectid;
        var cred = "Token " + api_token;
        var all_diagrams = baseurl + project_id + '/diagrams/' + diagram_id + '/thumbnail/' + reqUUID + '/';
        let headers = {
            "Authorization": cred
        };
        var URLS = [all_diagrams];
        axios
            .get(all_diagrams, {
                responseType: 'arraybuffer',
                headers: headers
            })
            .then(res => {
                let im = Buffer.from(res.data, 'binary').toString('base64');
                const img = Buffer.from(im, 'base64');
                response.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': img.length
                });

                response.end(img);
            })
        //     async.map(URLS, function (url, done) {
        //         let headers = {
        //             "Authorization": cred
        //         };
        //         let image = getBase64(url, headers);
        //         return done(null, image);
        //         // req({
        //         //     url: url,
        //         //     headers: {
        //         //         "Authorization": cred,
        //         //         "Content-Type": "application/json"
        //         //     }
        //         // }, function (err, response, body) {
        //         //     if (err || response.statusCode !== 200) {
        //         //         return done(err || new Error());
        //         //     }
        //         //     return done(null, JSON.parse(body));
        //         // });
        //     }, function (err, results) {
        //         if (err) return response.sendStatus(500);
        //         response.setHeader("Content-Type", "image/png");
        //         response.send(results[0]); // Send the file data to the browser.

        //     });

        // } else {
        //     response.status(400).send('Not all parameters supplied.');

        // };
    }
});

app.get('/diagrams', function (request, response) {

    if (request.query.apitoken && request.query.projectid) {

        var api_token = request.query.apitoken;
        var project_id = request.query.projectid;

        var cred = "Token " + api_token;

        var systems = baseurl + project_id + '/systems/';
        var all_diagrams = baseurl + project_id + '/diagrams/all/details/';
        var diagram_thumbnails = baseurl + project_id + '/diagrams/all/generate_thumbnails/';

        var URLS = [systems, all_diagrams, diagram_thumbnails];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    if (response.statusCode == 429) {
                        return done(err || new Error("Too many requests from your profie"));
                    }
                    else {
                        return done(err || new Error());
                    }
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {
            if (err) return response.sendStatus(500);
            let thumbnail_data = results[2];

            var thumbnails_uuid = thumbnail_data['results_url'][0].split('/').slice(-2)[0];

            response.render('diagrams', {
                "status": 1,
                "systems": results[0],
                "thumbnails_uuid": thumbnails_uuid,
                "all_diagrams": results[1],
                "project_id": project_id,
                "api_token": api_token
            });
        });

    } else {
        response.status(400).send('Not all parameters supplied.')

    };
});

app.listen(process.env.PORT || 5001);