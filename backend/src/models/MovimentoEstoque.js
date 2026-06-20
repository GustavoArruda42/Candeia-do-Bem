const mongoose = require('mongoose');

const movimentoEstoqueSchema = new mongoose.Schema({
  item: { type: String, required: true },
  tipo: { type: String, enum: ['entrada', 'saida'], required: true },
  quantidade: { type: Number, required: true },
  motivo: { type: String, trim: true },
  distribuicaoRelacionada: { type: mongoose.Schema.Types.ObjectId, ref: 'Distribuicao' },
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('MovimentoEstoque', movimentoEstoqueSchema);
