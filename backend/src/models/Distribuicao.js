const mongoose = require('mongoose');

const distribuicaoSchema = new mongoose.Schema({
  data: { type: Date, required: true, unique: true },
  qtdQuentinhas: { type: Number, required: true, min: 0 },
  qtdAguas: { type: Number, required: true, min: 0 },
  qtdBananadasGarfos: { type: Number, required: true, min: 0 },
  qtdGarfos: { type: Number, default: 0, min: 0 },
  pessoasPresentes: { type: Number, required: true, min: 0 },
  pessoasAtendidas: { type: Number, required: true, min: 0 },
  qtdRepeticoes: { type: Number, default: 0, min: 0 },
  racaoCachorro: { type: Number, default: 0, min: 0 },
  racaoGato: { type: Number, default: 0, min: 0 },
  qtdSabonete: { type: Number, default: 0, min: 0 },
  qtdPastaDente: { type: Number, default: 0, min: 0 },
  qtdEscovaDente: { type: Number, default: 0, min: 0 },
  qtdAbsorvente: { type: Number, default: 0, min: 0 },
  qtdPapelHigienico: { type: Number, default: 0, min: 0 },
  observacoes: { type: String, trim: true },
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Distribuicao', distribuicaoSchema);
