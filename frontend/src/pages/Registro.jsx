import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { domingoAtual } from '../utils/datas';
import styles from './Registro.module.css';

const camposPrincipais = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',            emoji: '🍱', obrigatorio: true },
  { key: 'qtdAguas',           label: 'Águas',                 emoji: '💧', obrigatorio: true },
  { key: 'qtdBananadasGarfos', label: 'Bananadas + Garfos',    emoji: '🍌', obrigatorio: true },
  { key: 'pessoasPresentes',   label: 'Voluntários presentes', emoji: '🙋', obrigatorio: true },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas',     emoji: '🤝', obrigatorio: true },
  { key: 'qtdRepeticoes',      label: 'Repetições',            emoji: '🔁', obrigatorio: false },
];

const camposExtras = [
  { key: 'racaoCachorro', label: 'Ração Cachorro', emoji: '🐶' },
  { key: 'racaoGato',     label: 'Ração Gato',      emoji: '🐱' },
];

const estadoInicial = () => {
  const obj = { data: domingoAtual(), observacoes: '', kitHigiene: false, qtdKitHigiene: '' };
  [...camposPrincipais, ...camposExtras].forEach(c => { obj[c.key] = c.key === 'qtdRepeticoes' ? '0' : ''; });
  return obj;
};

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState(estadoInicial());
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const payload = { data: form.data, observacoes: form.observacoes };
      [...camposPrincipais, ...camposExtras].forEach(c => {
        payload[c.key] = Number(form[c.key]) || 0;
      });
      payload.kitHigiene = form.kitHigiene;
      payload.qtdKitHigiene = form.kitHigiene ? (Number(form.qtdKitHigiene) || 0) : 0;

      await api.post('/distribuicoes', payload);
      setSucesso(true);
      setTimeout(() => navigate('/historico'), 1800);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar registro');
    } finally {
      setCarregando(false);
    }
  };

  const renderGrupo = (titulo, campos) => (
    <div className={styles.grupo}>
      <h3 className={styles.grupoTitulo}>{titulo}</h3>
      <div className={styles.grade}>
        {campos.map(c => (
          <div key={c.key} className={styles.campo}>
            <label>{c.emoji} {c.label}</label>
            <input
              type="number"
              name={c.key}
              value={form[c.key]}
              onChange={handleChange}
              min="0"
              required={c.obrigatorio}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Novo Registro</h1>
        <p>Preencha os dados da distribuição de domingo</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.campo}>
          <label>📅 Data da distribuição</label>
          <input type="date" name="data" value={form.data} onChange={handleChange} required />
        </div>

        {renderGrupo('Distribuição principal', camposPrincipais)}
        {renderGrupo('Itens extras', camposExtras)}

        <div className={styles.grupo}>
          <h3 className={styles.grupoTitulo}>Kit Higiene (opcional)</h3>
          <div className={styles.campo}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.kitHigiene}
                onChange={e => setForm(p => ({ ...p, kitHigiene: e.target.checked, qtdKitHigiene: '' }))}
              />
              🧴 Kit Higiene distribuído
            </label>
          </div>
          {form.kitHigiene && (
            <div className={styles.campo}>
              <label>🧴 Quantidade de Kits</label>
              <input
                type="number"
                name="qtdKitHigiene"
                value={form.qtdKitHigiene}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
              <span className={styles.dica}>Cada kit consome 1 sabonete, 1 pasta de dente, 1 escova, 1 absorvente e 1 papel higiênico do estoque.</span>
            </div>
          )}
        </div>

        <div className={styles.campo}>
          <label>📝 Observações <span className={styles.opcional}>(opcional)</span></label>
          <textarea
            name="observacoes"
            value={form.observacoes}
            onChange={handleChange}
            rows={3}
            placeholder="Algum acontecimento especial, dificuldade, agradecimento..."
          />
        </div>

        {erro && <p className={styles.erro}>⚠️ {erro}</p>}
        {sucesso && <p className={styles.sucesso}>✅ Registro salvo! Redirecionando...</p>}

        <div className={styles.acoes}>
          <button type="button" className={styles.btnSecundario} onClick={() => navigate('/historico')}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimario} disabled={carregando || sucesso}>
            {carregando ? 'Salvando...' : 'Salvar registro'}
          </button>
        </div>
      </form>
    </div>
  );
}
