const Distribuicao = require('../models/Distribuicao');

const listar = async (req, res) => {
  try {
    const distribuicoes = await Distribuicao.find()
      .populate('registradoPor', 'username')
      .sort({ data: -1 });
    res.json(distribuicoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const distribuicao = await Distribuicao.findById(req.params.id)
      .populate('registradoPor', 'username');
    if (!distribuicao) {
      return res.status(404).json({ erro: 'Distribuição não encontrada' });
    }
    res.json(distribuicao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const criar = async (req, res) => {
  const {
    data, qtdQuentinhas, qtdAguas, qtdBananadasGarfos,
    pessoasPresentes, pessoasAtendidas, qtdRepeticoes, kitHigiene, qtdKitHigiene, racaoCachorro, racaoGato, observacoes
  } = req.body;

  if (!data || qtdQuentinhas == null || qtdAguas == null || qtdBananadasGarfos == null
    || pessoasPresentes == null || pessoasAtendidas == null) {
    return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
  }

  try {
    const existe = await Distribuicao.findOne({ data: new Date(data) });
    if (existe) {
      return res.status(409).json({ erro: 'Já existe um registro para esta data' });
    }

    const distribuicao = await Distribuicao.create({
      data: new Date(data),
      qtdQuentinhas,
      qtdAguas,
      qtdBananadasGarfos,
      pessoasPresentes,
      pessoasAtendidas,
      qtdRepeticoes: qtdRepeticoes ?? 0,
      kitHigiene: kitHigiene ?? false,
      qtdKitHigiene: kitHigiene ? qtdKitHigiene ?? 0 : 0,
      racaoCachorro: racaoCachorro ?? 0,
      racaoGato: racaoGato ?? 0,
      observacoes,
      registradoPor: req.usuario.id
    });

    res.status(201).json(distribuicao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const atualizar = async (req, res) => {
  try {
    const distribuicao = await Distribuicao.findById(req.params.id);
    if (!distribuicao) {
      return res.status(404).json({ erro: 'Distribuição não encontrada' });
    }

    const isAdmin = req.usuario.role === 'admin';
    const isAutor = distribuicao.registradoPor?.toString() === req.usuario.id;

    if (!isAdmin && !isAutor) {
      return res.status(403).json({ erro: 'Sem permissão para editar este registro' });
    }

    const campos = [
      'qtdQuentinhas', 'qtdAguas', 'qtdBananadasGarfos',
      'pessoasPresentes', 'pessoasAtendidas', 'qtdRepeticoes', 'observacoes','kitHigiene', 'qtdKitHigiene',
      'kitHigiene', 'qtdKitHigiene', 'racaoCachorro', 'racaoGato', 'observacoes',
    ];

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) distribuicao[campo] = req.body[campo];
    });

    await distribuicao.save();
    res.json(distribuicao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const remover = async (req, res) => {
  try {
    const distribuicao = await Distribuicao.findByIdAndDelete(req.params.id);
    if (!distribuicao) {
      return res.status(404).json({ erro: 'Distribuição não encontrada' });
    }
    res.json({ mensagem: 'Registro removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
