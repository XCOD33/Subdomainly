const express = require('express');
const subdomainRoutes = require('./routes/subdomainRoute');
const domainRoutes = require('./routes/domainRoute');
const blockNameRoutes = require('./routes/blockNameRoute');
const authRoutes = require('./routes/authRoute');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: 'https://subdomainly.com',
  methods: 'GET,PUT,POST,DELETE',
};

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/subdomain', subdomainRoutes);
app.use('/api/domain', domainRoutes);
app.use('/api/block-name', blockNameRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;
