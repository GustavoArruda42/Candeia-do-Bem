const mongoose = require('mongoose');

const ITENS_ESTOQUE = [
  'aguas', 'bananadasGarfos', 'garfos',
  'sabonete', 'pastaDente', 'escovaDente', 'absorvente', 'papelHigienico'
];

const estoqueSchema = new mongoose.Schema({
  item: { type: String, required: true, unique: true, enum: ITENS_ESTOQUE },
  quantidade: { type: Number, required: true, default: 0 },
  estoqueMinimo: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Estoque', estoqueSchema);
module.exports.ITENS_ESTOQUE = ITENS_ESTOQUE;
