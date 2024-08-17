const express = require('express');
const subdomainRoutes = require('./routes/subdomainRoute');
const domainRoutes = require('./routes/domainRoute');

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/subdomain', subdomainRoutes);
app.use('/api/domain', domainRoutes);

module.exports = app;
