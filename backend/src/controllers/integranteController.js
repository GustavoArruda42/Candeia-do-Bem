const Integrante = require('../models/Integrante');

const listar = async (req, res) => {
  try {
    const integrantes = await Integrante.find({ ativo: true }).sort({ nome: 1 });
    res.json(integrantes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const criar = async (req, res) => {
  const { nome, tipo } = req.body;
  if (!nome || !tipo) return res.status(400).json({ erro: 'Nome e tipo são obrigatórios' });
  try {
    const integrante = await Integrante.create({ nome, tipo });
    res.status(201).json(integrante);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const atualizar = async (req, res) => {
  try {
    const integrante = await Integrante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!integrante) return res.status(404).json({ erro: 'Integrante não encontrado' });
    res.json(integrante);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const remover = async (req, res) => {
  try {
    await Integrante.findByIdAndUpdate(req.params.id, { ativo: false });
    res.json({ mensagem: 'Integrante removido' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, criar, atualizar, remover };