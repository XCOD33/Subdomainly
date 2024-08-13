const express = require('express');
const webRoute = require('./routes/webRoute');
const apiRoute = require('./routes/apiRoute');

const app = express();

// set view engine
app.set('view engine', 'ejs');
// set views directory
app.set('views', 'app/views');

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api', apiRoute);
app.use('/', webRoute);

module.exports = app;
