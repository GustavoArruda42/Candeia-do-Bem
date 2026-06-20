const Distribuicao = require('../models/Distribuicao');
const Estoque = require('../models/Estoque');
const MovimentoEstoque = require('../models/MovimentoEstoque');

const ITENS_KIT_HIGIENE = ['sabonete', 'pastaDente', 'escovaDente', 'absorvente', 'papelHigienico'];

// Converte os dados de uma distribuição em um mapa { itemEstoque: quantidadeConsumida }
const calcularConsumoEstoque = (dados) => {
  const consumo = {
    aguas: dados.qtdAguas || 0,
    bananadasGarfos: dados.qtdBananadasGarfos || 0,
    garfos: dados.qtdBananadasGarfos || 0, // cada bananada vem com 1 garfo
  };

  if (dados.kitHigiene && dados.qtdKitHigiene > 0) {
    ITENS_KIT_HIGIENE.forEach(item => {
      consumo[item] = dados.qtdKitHigiene;
    });
  }

  return consumo;
};

const aplicarMovimentoEstoque = async (item, quantidade, tipo, motivo, distribuicaoId, usuarioId) => {
  let estoque = await Estoque.findOne({ item });
  if (!estoque) estoque = await Estoque.create({ item, quantidade: 0 });

  estoque.quantidade += tipo === 'entrada' ? quantidade : -quantidade;
  await estoque.save();

  await MovimentoEstoque.create({
    item, tipo, quantidade, motivo,
    distribuicaoRelacionada: distribuicaoId,
    registradoPor: usuarioId
  });
};

const descontarEstoque = async (dados, distribuicaoId, usuarioId) => {
  const consumo = calcularConsumoEstoque(dados);
  for (const [item, quantidade] of Object.entries(consumo)) {
    if (quantidade <= 0) continue;
    await aplicarMovimentoEstoque(item, quantidade, 'saida', 'Distribuição semanal', distribuicaoId, usuarioId);
  }
};

const estornarEstoque = async (dadosAntigos, dadosNovos, distribuicaoId, usuarioId) => {
  const consumoAntigo = calcularConsumoEstoque(dadosAntigos);
  const consumoNovo = calcularConsumoEstoque(dadosNovos);
  const itens = new Set([...Object.keys(consumoAntigo), ...Object.keys(consumoNovo)]);

  for (const item of itens) {
    const antigo = consumoAntigo[item] || 0;
    const novo = consumoNovo[item] || 0;
    const diferenca = novo - antigo;
    if (diferenca === 0) continue;

    await aplicarMovimentoEstoque(
      item, Math.abs(diferenca), diferenca > 0 ? 'saida' : 'entrada',
      'Ajuste de edição de registro', distribuicaoId, usuarioId
    );
  }
};

const devolverEstoque = async (dados, distribuicaoId, usuarioId) => {
  const consumo = calcularConsumoEstoque(dados);
  for (const [item, quantidade] of Object.entries(consumo)) {
    if (quantidade <= 0) continue;
    await aplicarMovimentoEstoque(item, quantidade, 'entrada', 'Exclusão de registro', distribuicaoId, usuarioId);
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
    data, qtdQuentinhas, qtdAguas, qtdBananadasGarfos,
    pessoasPresentes, pessoasAtendidas, qtdRepeticoes,
    racaoCachorro, racaoGato,
    kitHigiene, qtdKitHigiene,
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
      pessoasPresentes, pessoasAtendidas,
      qtdRepeticoes: qtdRepeticoes ?? 0,
      racaoCachorro: racaoCachorro || 0,
      racaoGato: racaoGato || 0,
      kitHigiene: !!kitHigiene,
      qtdKitHigiene: kitHigiene ? (qtdKitHigiene || 0) : 0,
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

    const dadosAntigos = {
      qtdAguas: distribuicao.qtdAguas,
      qtdBananadasGarfos: distribuicao.qtdBananadasGarfos,
      kitHigiene: distribuicao.kitHigiene,
      qtdKitHigiene: distribuicao.qtdKitHigiene,
    };

    const campos = [
      'qtdQuentinhas', 'qtdAguas', 'qtdBananadasGarfos',
      'pessoasPresentes', 'pessoasAtendidas', 'qtdRepeticoes',
      'racaoCachorro', 'racaoGato',
      'kitHigiene', 'qtdKitHigiene',
      'observacoes'
    ];

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) distribuicao[campo] = req.body[campo];
    });

    if (!distribuicao.kitHigiene) distribuicao.qtdKitHigiene = 0;

    const dadosNovos = {
      qtdAguas: distribuicao.qtdAguas,
      qtdBananadasGarfos: distribuicao.qtdBananadasGarfos,
      kitHigiene: distribuicao.kitHigiene,
      qtdKitHigiene: distribuicao.qtdKitHigiene,
    };

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
