const express = require('express');
const subdomainRoutes = require('./routes/subdomainRoute');
const domainRoutes = require('./routes/domainRoute');
const blockNameRoutes = require('./routes/blockNameRoute');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/subdomain', subdomainRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/block-name', blockNameRoutes);

module.exports = app;
