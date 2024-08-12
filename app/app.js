const express = require('express');
const exampleRoute = require('./routes/exampleRoute');

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/example', exampleRoute);

module.exports = app;
