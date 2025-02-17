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

// var baseurl = 'http://local.test:8000/api/v1/projects/';
var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';

app.get('/', async function (request, response) {
    try {
        if (!request.query.apitoken || !request.query.projectid) {
            return response.status(400).send('Not all parameters supplied.');
        }

        const api_token = request.query.apitoken;
        const project_id = request.query.projectid;
        const cred = "Token " + api_token;

        const systemsUrl = baseurl + project_id + '/systems/';
        const diagramsUrl = baseurl + project_id + '/diagrams/';
        const headers = {
            "Authorization": cred,
            "Content-Type": "application/json"
        };

        const [systemsResponse, diagramsResponse] = await Promise.all([
            axios.get(systemsUrl, { headers }),
            axios.get(diagramsUrl, { headers })
        ]);

        response.render('index', {
            "status": 1,
            "data": [systemsResponse.data, diagramsResponse.data],
            "api_token": api_token,
            "project_id": project_id
        });
    } catch (error) {
        if (error.response && error.response.status === 429) {
            return response.status(429).send("Too many requests from your profile");
        }
        response.sendStatus(500);
    }
});

app.get('/images/:diagram_id(\\d+)/:uuid?/', async function (request, response) {

    let reqUUID = request.params.uuid;
    let diagram_id = request.params.diagram_id;
    const is_uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reqUUID);
    diagram_id = parseInt(diagram_id);
    const is_int = Number.isInteger(diagram_id);

    if (!is_uuid || !is_int) {
        return response.status(400).send('Invalid parameters supplied.');
    }

    if (!request.query.apitoken || !request.query.projectid) {
        return response.status(400).send('Not all parameters supplied.');
    }

    const api_token = request.query.apitoken;
    const project_id = request.query.projectid;
    const cred = "Token " + api_token;
    const all_diagrams = `${baseurl}${project_id}/diagrams/${diagram_id}/thumbnail/${reqUUID}/`;
    const headers = {
        "Authorization": cred
    };

    try {
        const res = await axios.get(all_diagrams, {
            responseType: 'arraybuffer',
            headers: headers
        });

        const img = Buffer.from(res.data, 'binary');
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        response.end(img);
    } catch (error) {
        response.sendStatus(500);
    }
});

app.get('/diagrams', async function (request, response) {
    try {
        if (!request.query.apitoken || !request.query.projectid) {
            return response.status(400).send('Not all parameters supplied.');
        }

        const api_token = request.query.apitoken;
        const project_id = request.query.projectid;
        const cred = "Token " + api_token;

        const systemsUrl = baseurl + project_id + '/systems/';
        const allDiagramsUrl = baseurl + project_id + '/diagrams/all/details/';
        const diagramThumbnailsUrl = baseurl + project_id + '/diagrams/all/generate_thumbnails/';
        const headers = {
            "Authorization": cred,
            "Content-Type": "application/json"
        };

        const [systemsResponse, allDiagramsResponse, diagramThumbnailsResponse] = await Promise.all([
            axios.get(systemsUrl, { headers }),
            axios.get(allDiagramsUrl, { headers }),
            axios.get(diagramThumbnailsUrl, { headers })
        ]);

        const thumbnail_data = diagramThumbnailsResponse.data;
        const thumbnails_uuid = thumbnail_data['results_url'][0].split('/').slice(-2)[0];

        response.render('diagrams', {
            "status": 1,
            "systems": systemsResponse.data,
            "thumbnails_uuid": thumbnails_uuid,
            "all_diagrams": allDiagramsResponse.data,
            "project_id": project_id,
            "api_token": api_token
        });
    } catch (error) {
        if (error.response && error.response.status === 429) {
            return response.status(429).send("Too many requests from your profile");
        }
        response.sendStatus(500);
    }
});

app.listen(process.env.PORT || 5001);