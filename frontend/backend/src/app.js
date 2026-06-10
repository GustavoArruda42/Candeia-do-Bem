const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const distribuicaoRoutes = require('./routes/distribuicoes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/distribuicoes', distribuicaoRoutes);

module.exports = app;
