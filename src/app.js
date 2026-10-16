require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cadastro = require('./routes/cadastro');
const cartoes = require('./routes/cartoes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/cadastro', cadastro);
app.use('/api/cartoes', cartoes);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
