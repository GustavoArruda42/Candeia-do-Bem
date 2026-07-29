const Cozinheira = require('../models/Cozinheira');

const listar = async (req, res) => {
  try {
    const cozinheiras = await Cozinheira.find({ ativa: true }).sort({ nome: 1 });
    res.json(cozinheiras);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const criar = async (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  try {
    const cozinheira = await Cozinheira.create({ nome });
    res.status(201).json(cozinheira);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const atualizar = async (req, res) => {
  try {
    const cozinheira = await Cozinheira.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cozinheira) return res.status(404).json({ erro: 'Cozinheira não encontrada' });
    res.json(cozinheira);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const remover = async (req, res) => {
  try {
    await Cozinheira.findByIdAndUpdate(req.params.id, { ativa: false });
    res.json({ mensagem: 'Cozinheira removida' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, criar, atualizar, remover };