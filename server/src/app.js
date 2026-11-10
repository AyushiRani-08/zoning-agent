const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const feasibilityRoutes = require('./routes/feasibility');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/feasibility', feasibilityRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
