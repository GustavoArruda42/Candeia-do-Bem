const Distribuicao = require('../models/Distribuicao');
const Estoque = require('../models/Estoque');
const MovimentoEstoque = require('../models/MovimentoEstoque');

// Mapeia campo da distribuição -> item de estoque correspondente
const MAPA_ESTOQUE = {
  qtdAguas: 'aguas',
  qtdBananadasGarfos: 'bananadasGarfos',
  qtdGarfos: 'garfos',
  qtdSabonete: 'sabonete',
  qtdPastaDente: 'pastaDente',
  qtdEscovaDente: 'escovaDente',
  qtdAbsorvente: 'absorvente',
  qtdPapelHigienico: 'papelHigienico'
};

const descontarEstoque = async (dadosDistribuicao, distribuicaoId, usuarioId) => {
  for (const [campo, item] of Object.entries(MAPA_ESTOQUE)) {
    const quantidade = dadosDistribuicao[campo] || 0;
    if (quantidade <= 0) continue;

    let estoque = await Estoque.findOne({ item });
    if (!estoque) {
      estoque = await Estoque.create({ item, quantidade: 0 });
    }
    estoque.quantidade -= quantidade;
    await estoque.save();

    await MovimentoEstoque.create({
      item,
      tipo: 'saida',
      quantidade,
      motivo: 'Distribuição semanal',
      distribuicaoRelacionada: distribuicaoId,
      registradoPor: usuarioId
    });
  }
};

const estornarEstoque = async (dadosAntigos, dadosNovos, distribuicaoId, usuarioId) => {
  for (const [campo, item] of Object.entries(MAPA_ESTOQUE)) {
    const antigo = dadosAntigos[campo] || 0;
    const novo = dadosNovos[campo] !== undefined ? dadosNovos[campo] : antigo;
    const diferenca = novo - antigo; // positivo = consumir mais; negativo = devolver

    if (diferenca === 0) continue;

    let estoque = await Estoque.findOne({ item });
    if (!estoque) estoque = await Estoque.create({ item, quantidade: 0 });

    estoque.quantidade -= diferenca;
    await estoque.save();

    await MovimentoEstoque.create({
      item,
      tipo: diferenca > 0 ? 'saida' : 'entrada',
      quantidade: Math.abs(diferenca),
      motivo: 'Ajuste de edição de registro',
      distribuicaoRelacionada: distribuicaoId,
      registradoPor: usuarioId
    });
  }
};

const devolverEstoque = async (dadosDistribuicao, distribuicaoId, usuarioId) => {
  for (const [campo, item] of Object.entries(MAPA_ESTOQUE)) {
    const quantidade = dadosDistribuicao[campo] || 0;
    if (quantidade <= 0) continue;

    let estoque = await Estoque.findOne({ item });
    if (!estoque) estoque = await Estoque.create({ item, quantidade: 0 });
    estoque.quantidade += quantidade;
    await estoque.save();

    await MovimentoEstoque.create({
      item,
      tipo: 'entrada',
      quantidade,
      motivo: 'Exclusão de registro',
      distribuicaoRelacionada: distribuicaoId,
      registradoPor: usuarioId
    });
  }
};

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
    data, qtdQuentinhas, qtdAguas, qtdBananadasGarfos, qtdGarfos,
    pessoasPresentes, pessoasAtendidas, qtdRepeticoes,
    racaoCachorro, racaoGato,
    qtdSabonete, qtdPastaDente, qtdEscovaDente, qtdAbsorvente, qtdPapelHigienico,
    observacoes
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

    const dados = {
      qtdQuentinhas, qtdAguas, qtdBananadasGarfos,
      qtdGarfos: qtdGarfos || 0,
      pessoasPresentes, pessoasAtendidas,
      qtdRepeticoes: qtdRepeticoes ?? 0,
      racaoCachorro: racaoCachorro || 0,
      racaoGato: racaoGato || 0,
      qtdSabonete: qtdSabonete || 0,
      qtdPastaDente: qtdPastaDente || 0,
      qtdEscovaDente: qtdEscovaDente || 0,
      qtdAbsorvente: qtdAbsorvente || 0,
      qtdPapelHigienico: qtdPapelHigienico || 0,
    };

    const distribuicao = await Distribuicao.create({
      data: new Date(data),
      ...dados,
      observacoes,
      registradoPor: req.usuario.id
    });

    await descontarEstoque(dados, distribuicao._id, req.usuario.id);

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
      'qtdQuentinhas', 'qtdAguas', 'qtdBananadasGarfos', 'qtdGarfos',
      'pessoasPresentes', 'pessoasAtendidas', 'qtdRepeticoes',
      'racaoCachorro', 'racaoGato',
      'qtdSabonete', 'qtdPastaDente', 'qtdEscovaDente', 'qtdAbsorvente', 'qtdPapelHigienico',
      'observacoes'
    ];

    const dadosAntigos = {
      qtdAguas: distribuicao.qtdAguas,
      qtdBananadasGarfos: distribuicao.qtdBananadasGarfos,
      qtdGarfos: distribuicao.qtdGarfos,
      qtdSabonete: distribuicao.qtdSabonete,
      qtdPastaDente: distribuicao.qtdPastaDente,
      qtdEscovaDente: distribuicao.qtdEscovaDente,
      qtdAbsorvente: distribuicao.qtdAbsorvente,
      qtdPapelHigienico: distribuicao.qtdPapelHigienico,
    };

    const dadosNovos = {};
    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        distribuicao[campo] = req.body[campo];
        dadosNovos[campo] = req.body[campo];
      }
    });

    await distribuicao.save();
    await estornarEstoque(dadosAntigos, dadosNovos, distribuicao._id, req.usuario.id);

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

    await devolverEstoque(distribuicao.toObject(), distribuicao._id, req.usuario.id);

    res.json({ mensagem: 'Registro removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
