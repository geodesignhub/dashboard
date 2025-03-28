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
        const { apitoken: api_token, projectid: project_id } = request.query;

        if (!api_token || !project_id) {
            return response.status(400).send('Not all parameters supplied.');
        }

        const cred = `Token ${api_token}`;
        const headers = {
            "Authorization": cred,
            "Content-Type": "application/json"
        };

        const endpoints = [
            `${baseurl}${project_id}/systems/`,
            `${baseurl}${project_id}/diagrams/`
        ];

        const [systemsResponse, diagramsResponse] = await Promise.all(
            endpoints.map(url => axios.get(url, { headers }))
        );

        response.render('index', {
            status: 1,
            data: [systemsResponse.data, diagramsResponse.data],
            api_token,
            project_id
        });
    } catch (error) {
        if (error.response?.status === 429) {
            return response.status(429).send("Too many requests from your profile");
        }
        response.sendStatus(500);
    }
});
app.get('/images/:diagram_id(\\d+)/:uuid?/', async function (request, response) {
    try {
        const { uuid: reqUUID, diagram_id } = request.params;
        const { apitoken: api_token, projectid: project_id } = request.query;

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reqUUID) || 
            !Number.isInteger(parseInt(diagram_id))) {
            return response.status(400).send('Invalid parameters supplied.');
        }

        if (!api_token || !project_id) {
            return response.status(400).send('Not all parameters supplied.');
        }

        const headers = { "Authorization": `Token ${api_token}` };
        const diagramThumbnailUrl = `${baseurl}${project_id}/diagrams/${diagram_id}/thumbnail/${reqUUID}/`;

        const res = await axios.get(diagramThumbnailUrl, {
            responseType: 'arraybuffer',
            headers
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
        const { apitoken: api_token, projectid: project_id } = request.query;

        if (!api_token || !project_id) {
            return response.status(400).send('Not all parameters supplied.');
        }

        const headers = {
            "Authorization": `Token ${api_token}`,
            "Content-Type": "application/json"
        };

        const endpoints = [
            `${baseurl}${project_id}/systems/`,
            `${baseurl}${project_id}/diagrams/all/details/`,
            `${baseurl}${project_id}/diagrams/all/generate_thumbnails/`
        ];

        const [systemsResponse, allDiagramsResponse, diagramThumbnailsResponse] = await Promise.all(
            endpoints.map(url => axios.get(url, { headers }))
        );

        const thumbnails_uuid = diagramThumbnailsResponse.data['results_url'][0].split('/').slice(-2)[0];

        response.render('diagrams', {
            status: 1,
            systems: systemsResponse.data,
            thumbnails_uuid,
            all_diagrams: allDiagramsResponse.data,
            project_id,
            api_token
        });
    } catch (error) {
        if (error.response?.status === 429) {
            return response.status(429).send("Too many requests from your profile");
        }
        response.sendStatus(500);
    }
});

app.listen(process.env.PORT || 5001);