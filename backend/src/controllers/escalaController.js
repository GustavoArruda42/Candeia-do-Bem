const Escala = require('../models/Escala');

const buscar = async (req, res) => {
  const { mes, ano } = req.query;
  try {
    const escala = await Escala.findOne({ mes: Number(mes), ano: Number(ano) })
      .populate('domingos.alocacoes.integrante', 'nome tipo')
      .populate('domingos.cozinheiras.cozinheira', 'nome');
    res.json(escala || null);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const salvar = async (req, res) => {
  const { mes, ano, domingos } = req.body;

  if (!mes || !ano || !domingos) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }

  // Validação: cada domingo deve ter exatamente 2 motoristas
  for (const domingo of domingos) {
    const motoristas = domingo.alocacoes.filter(a => a.role === 'motorista');
    if (motoristas.length !== 2) {
      const data = new Date(domingo.data).toLocaleDateString('pt-BR');
      return res.status(400).json({
        erro: `O domingo ${data} precisa ter exatamente 2 motoristas`
      });
    }
  }

  try {
    const escala = await Escala.findOneAndUpdate(
      { mes, ano },
      { mes, ano, domingos },
      { new: true, upsert: true, runValidators: true }
    ).populate('domingos.alocacoes.integrante', 'nome tipo')
     .populate('domingos.cozinheiras.cozinheira', 'nome');

    res.json(escala);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { buscar, salvar };