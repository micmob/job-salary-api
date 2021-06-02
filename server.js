const express = require('express');

const app = express();

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const axios = require('axios');

// GET /search/job?job={job}

app.get('/search/job/', async (req, res) => {
    const job = req.query.job;
    const URL = `https://www.salaryexpert.com/api/typeahead/jobsearch?q=${job}`;

    const response = await fetch(URL);
    if (response.ok) {
        try {
            const html = await response.text();
            const $ = cheerio.load(html);

            const jobs = JSON.parse($('body').text());

            return res.status(200).json({ jobs });
        } catch (err) {
            return res.status(400).json({ error: 'Something went wrong.' });
        }
    }

    return res
        .status(400)
        .json({ error: 'Salary Expert cannot process this job.' });
});

// GET /search/location?location={location}

app.get('/search/location/', async (req, res) => {
    const location = req.query.location;
    const URL = `https://www.salaryexpert.com/api/typeahead/gscareasearch?q=${location}`;

    const response = await fetch(URL);
    if (response.ok) {
        try {
            const html = await response.text();
            const $ = cheerio.load(html);

            const locations = JSON.parse($('body').text());

            return res.status(200).json({ locations });
        } catch (err) {
            return res.status(400).json({ error: 'Something went wrong.' });
        }
    }

    return res
        .status(400)
        .json({ error: 'Salary Expert cannot process this location.' });
});

// GET salary/:job/:location

app.get('/salary/:job/:location', async (req, res) => {
    const job = req.params.job;
    const location = req.params.location;

    const URL = `https://www.salaryexpert.com/salary/job/${job}/${location}`;

    const response = await fetch(URL);
    if (response.ok) {
        try {
            const html = await response.text();
            const $ = cheerio.load(html);

            const obj = $('#sd-chart-salaryByExp').attr('data-json');

            var { Average, Entry, Senior } = JSON.parse(obj)[0];

            const currencyData = $('.overview-compensations .base h2').text();

            var currency = currencyData.substring(
                currencyData.lastIndexOf('(') + 1,
                currencyData.lastIndexOf(')')
            );

            const responseConvert = await fetch(
                `https://api.exchangerate.host/convert?from=${currency.toString()}&to=USD`
            );

            if (responseConvert.ok) {
                const rate = parseFloat((await responseConvert.json()).result);
                Average = Average * rate;
                Entry = Entry * rate;
                Senior = Senior * rate;
            } else {
                return res.status(400).json({ error: 'Conversion error.' });
            }

            return res.status(200).json({
                salary: {
                    entry: parseInt(Entry),
                    average: parseInt(Average),
                    senior: parseInt(Senior)
                }
            });
        } catch (err) {
            return res.status(400).json({ error: 'Something went wrong.' });
        }
    }

    return res
        .status(400)
        .json({ error: 'Salary Expert cannot process this job/location.' });
});

app.get('*', (req, res) => {
    res.status(400).json({
        error: 'Please provide a job and a location.'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
