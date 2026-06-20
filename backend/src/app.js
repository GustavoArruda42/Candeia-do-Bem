const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const distribuicaoRoutes = require('./routes/distribuicoes');
const estoqueRoutes = require('./routes/estoque');
const app = express();

connectDB();

const origensPermitidas = [
  'http://localhost:5173',
  'https://candeia-do-bem.vercel.app'
];

app.use(cors({
  origin: origensPermitidas,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/distribuicoes', distribuicaoRoutes);
app.use('/api/estoque', estoqueRoutes);

module.exports = app;
