import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { domingoAtual } from '../utils/datas';
import styles from './Registro.module.css';

const camposNumericos = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',              emoji: '🍱', obrigatorio: true },
  { key: 'qtdAguas',           label: 'Águas',                   emoji: '💧', obrigatorio: true },
  { key: 'qtdBananadasGarfos', label: 'Bananadas + Garfos',      emoji: '🍌', obrigatorio: true },
  { key: 'pessoasPresentes',   label: 'Voluntários presentes',   emoji: '🙋', obrigatorio: true },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas',       emoji: '🤝', obrigatorio: true },
  { key: 'qtdRepeticoes',      label: 'Repetições',              emoji: '🔁', obrigatorio: false },
  { key: 'racaoCachorro',      label: 'Ração Cachorro', emoji: '🐶', obrigatorio: false },
  { key: 'racaoGato',          label: 'Ração Gato',     emoji: '🐱', obrigatorio: false },
];

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    data: domingoAtual(),
    qtdQuentinhas: '',
    qtdAguas: '',
    qtdBananadasGarfos: '',
    pessoasPresentes: '',
    pessoasAtendidas: '',
    qtdRepeticoes: '0',
    kitHigiene: false,
    qtdKitHigiene: '',
    racaoCachorro: '',
    racaoGato: '',
    observacoes: '',
  });
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
      await api.post('/distribuicoes', {
        ...form,
        qtdQuentinhas: Number(form.qtdQuentinhas),
        qtdAguas: Number(form.qtdAguas),
        qtdBananadasGarfos: Number(form.qtdBananadasGarfos),
        pessoasPresentes: Number(form.pessoasPresentes),
        pessoasAtendidas: Number(form.pessoasAtendidas),
        qtdRepeticoes: Number(form.qtdRepeticoes) || 0,
        kitHigiene: form.kitHigiene,
        qtdKitHigiene: form.kitHigiene ? Number(form.qtdKitHigiene) || 0 : 0,
        racaoCachorro: Number(form.racaoCachorro) || 0,
        racaoGato: Number(form.racaoGato) || 0,
      });
      setSucesso(true);
      setTimeout(() => navigate('/historico'), 1800);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar registro');
    } finally {
      setCarregando(false);
    }
  };

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

        <div className={styles.grade}>
          {camposNumericos.map(c => (
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

        <div className={styles.campo}>
          <label>
              <input
                  type="checkbox"
                  name="kitHigiene"
                  checked={form.kitHigiene}
                  onChange={e => setForm(p => ({ ...p, kitHigiene: e.target.checked, qtdKitHigiene: '' }))}
                  style={{ marginRight: 8 }}
              />
            🧴 Kit Higiene distribuído
          </label>
        </div>

{form.kitHigiene && (
  <div className={styles.campo}>
    <label>🧴 Quantidade de Kits Higiene</label>
    <input
      type="number"
      name="qtdKitHigiene"
      value={form.qtdKitHigiene}
      onChange={handleChange}
      min="0"
      placeholder="0"
    />
  </div>
)}

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
