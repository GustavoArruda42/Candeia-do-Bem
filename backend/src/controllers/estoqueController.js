const Estoque = require('../models/Estoque');
const MovimentoEstoque = require('../models/MovimentoEstoque');
const { ITENS_ESTOQUE } = require('../models/Estoque');

const listar = async (req, res) => {
  try {
    const itensExistentes = await Estoque.find();
    const mapaExistentes = Object.fromEntries(itensExistentes.map(i => [i.item, i]));

    const itensCompletos = await Promise.all(ITENS_ESTOQUE.map(async (item) => {
      if (mapaExistentes[item]) return mapaExistentes[item];
      return Estoque.create({ item, quantidade: 0 });
    }));

    res.json(itensCompletos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const adicionarEntrada = async (req, res) => {
  const { item, quantidade, motivo } = req.body;

  if (!item || !ITENS_ESTOQUE.includes(item)) {
    return res.status(400).json({ erro: 'Item de estoque inválido' });
  }
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
  }

  try {
    let estoque = await Estoque.findOne({ item });
    if (!estoque) {
      estoque = await Estoque.create({ item, quantidade: 0 });
    }

    estoque.quantidade += Number(quantidade);
    await estoque.save();

    await MovimentoEstoque.create({
      item,
      tipo: 'entrada',
      quantidade: Number(quantidade),
      motivo,
      registradoPor: req.usuario.id
    });

    res.json(estoque);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const atualizarMinimo = async (req, res) => {
  const { item } = req.params;
  const { estoqueMinimo } = req.body;

  if (!ITENS_ESTOQUE.includes(item)) {
    return res.status(400).json({ erro: 'Item de estoque inválido' });
  }

  try {
    const estoque = await Estoque.findOneAndUpdate(
      { item },
      { estoqueMinimo },
      { new: true, upsert: true }
    );
    res.json(estoque);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const historico = async (req, res) => {
  try {
    const movimentos = await MovimentoEstoque.find()
      .populate('registradoPor', 'username')
      .populate('distribuicaoRelacionada', 'data')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(movimentos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { listar, adicionarEntrada, atualizarMinimo, historico };
