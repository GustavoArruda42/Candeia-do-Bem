const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const login = async (req, res) => {
  const { username, senha } = req.body;

  if (!username || !senha) {
    return res.status(400).json({ erro: 'Username e senha são obrigatórios' });
  }

  try {
    const usuario = await Usuario.findOne({ username });
    if (!usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, username: usuario.username, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: usuario._id, username: usuario.username, role: usuario.role } });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const cadastrar = async (req, res) => {
  const { username, senha, role } = req.body;

  if (!username || !senha) {
    return res.status(400).json({ erro: 'Username e senha são obrigatórios' });
  }

  try {
    const existe = await Usuario.findOne({ username });
    if (existe) {
      return res.status(409).json({ erro: 'Username já está em uso' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({
      username,
      senhaHash,
      role: role === 'admin' ? 'admin' : 'membro'
    });

    res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario: { id: usuario._id, username: usuario.username, role: usuario.role } });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, '-senhaHash').sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const removerUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode remover sua própria conta' });
    }

    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({ mensagem: 'Usuário removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const cadastroPublico = async (req, res) => {
  const { username, senha } = req.body;

  if (!username || !senha) {
    return res.status(400).json({ erro: 'Username e senha são obrigatórios' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });
  }

  try {
    const existe = await Usuario.findOne({ username });
    if (existe) {
      return res.status(409).json({ erro: 'Username já está em uso' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({ username, senhaHash, role: 'membro' });

    res.status(201).json({ mensagem: 'Conta criada com sucesso', usuario: { id: usuario._id, username: usuario.username, role: usuario.role } });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};


module.exports = { login, cadastrar, cadastroPublico, listarUsuarios, removerUsuario };