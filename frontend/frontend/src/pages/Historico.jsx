import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatarData, formatarDataHora, formatarDataInput } from '../utils/datas';
import styles from './Historico.module.css';

const CAMPOS = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',            emoji: '🍱' },
  { key: 'qtdAguas',           label: 'Águas',                 emoji: '💧' },
  { key: 'qtdBananadasGarfos', label: 'Bananadas + Garfos',    emoji: '🍌' },
  { key: 'pessoasPresentes',   label: 'Voluntários presentes', emoji: '🙋' },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas',     emoji: '🤝' },
  { key: 'qtdRepeticoes',      label: 'Repetições',            emoji: '🔁' },
  { key: 'racaoCachorro', label: 'Ração Cachorro', emoji: '🐶' },
  { key: 'racaoGato',     label: 'Ração Gato',     emoji: '🐱' },
];

export default function Historico() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [distribuicoes, setDistribuicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [editando, setEditando] = useState(null); // distribuição em edição
  const [formEdicao, setFormEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');

  const carregar = () => {
    api.get('/distribuicoes').then(({ data }) => setDistribuicoes(data)).finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const podeEditar = (d) =>
    usuario?.role === 'admin' || d.registradoPor?._id === usuario?.id;

  const abrirEdicao = (d) => {
    setEditando(d);
    setErroEdicao('');
    setFormEdicao({
      qtdQuentinhas:      d.qtdQuentinhas,
      qtdAguas:           d.qtdAguas,
      qtdBananadasGarfos: d.qtdBananadasGarfos,
      pessoasPresentes:   d.pessoasPresentes,
      pessoasAtendidas:   d.pessoasAtendidas,
      qtdRepeticoes:      d.qtdRepeticoes,
      observacoes:        d.observacoes || '',
      kitHigiene:  d.kitHigiene || false,
      qtdKitHigiene: d.qtdKitHigiene || 0,
      racaoCachorro: d.racaoCachorro || 0,
      racaoGato:     d.racaoGato || 0,
    });
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    setErroEdicao('');
    try {
      await api.put(`/distribuicoes/${editando._id}`, {
        ...formEdicao,
        qtdQuentinhas:      Number(formEdicao.qtdQuentinhas),
        qtdAguas:           Number(formEdicao.qtdAguas),
        qtdBananadasGarfos: Number(formEdicao.qtdBananadasGarfos),
        pessoasPresentes:   Number(formEdicao.pessoasPresentes),
        pessoasAtendidas:   Number(formEdicao.pessoasAtendidas),
        qtdRepeticoes:      Number(formEdicao.qtdRepeticoes) || 0,
        kitHigiene: formEdicao.kitHigiene,
        qtdKitHigiene: formEdicao.kitHigiene ? Number(formEdicao.qtdKitHigiene) || 0 : 0,
        racaoCachorro: Number(formEdicao.racaoCachorro) || 0,
        racaoGato:     Number(formEdicao.racaoGato) || 0,
      });
      setEditando(null);
      carregar();
    } catch (err) {
      setErroEdicao(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id) => {
    try {
      await api.delete(`/distribuicoes/${id}`);
      setConfirmandoId(null);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao remover');
    }
  };

  if (carregando) return <div className={styles.loading}>Carregando...</div>;
  
  console.log('usuario:', usuario);
  console.log('registradoPor:', distribuicoes[0]?.registradoPor);

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Histórico</h1>
        <button className={styles.btnNovo} onClick={() => navigate('/registro')}>
          ✍️ Novo registro
        </button>
      </div>

      {distribuicoes.length === 0 ? (
        <div className={styles.vazio}>Nenhum registro encontrado.</div>
      ) : (
        <div className={styles.tabelaWrap}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Data</th>
                <th>🍱 Quentinhas</th>
                <th>💧 Águas</th>
                <th>🍌 Bananadas</th>
                <th>🙋 Presentes</th>
                <th>🤝 Atendidos</th>
                <th>🔁 Repetições</th>
                <th>🧴 Kit Higiene</th>
                <th>🐶 Ração Cachorro</th>
                <th>🐱 Ração Gato</th>
                <th>Registrado por</th>
                <th>Registrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {distribuicoes.map(d => (
                <tr key={d._id}>
                  <td className={styles.destaque}>{formatarData(d.data)}</td>
                  <td>{d.qtdQuentinhas}</td>
                  <td>{d.qtdAguas}</td>
                  <td>{d.qtdBananadasGarfos}</td>
                  <td>{d.pessoasPresentes}</td>
                  <td>{d.pessoasAtendidas}</td>
                  <td>{d.qtdRepeticoes}</td>
                  <td>{d.kitHigiene ? `✅ ${d.qtdKitHigiene}` : '—'}</td>
                  <td>{d.racaoCachorro || '—'}</td>
                  <td>{d.racaoGato || '—'}</td>
                  <td>{d.registradoPor?.username || '—'}</td>
                  <td className={styles.datahora}>{formatarDataHora(d.createdAt)}</td>
                  <td>
                    {podeEditar(d) && (
                      <div className={styles.acoes}>
                        <button className={styles.btnEditar} onClick={() => abrirEdicao(d)}>
                          Editar
                        </button>
                        {confirmandoId === d._id ? (
                          <span className={styles.confirmar}>
                            Confirmar?{' '}
                            <button className={styles.btnSim} onClick={() => remover(d._id)}>Sim</button>{' '}
                            <button className={styles.btnNao} onClick={() => setConfirmandoId(null)}>Não</button>
                          </span>
                        ) : (
                          <button className={styles.btnRemover} onClick={() => setConfirmandoId(d._id)}>
                            Excluir
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edição */}
      {editando && (
        <div className={styles.overlay} onClick={() => setEditando(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTopo}>
              <h2>Editar distribuição — {formatarData(editando.data)}</h2>
              <button className={styles.fechar} onClick={() => setEditando(null)}>✕</button>
            </div>

            <div className={styles.modalGrade}>
              {CAMPOS.map(c => (
                <div key={c.key} className={styles.campo}>
                  <label>{c.emoji} {c.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={formEdicao[c.key]}
                    onChange={e => setFormEdicao(p => ({ ...p, [c.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className={styles.campo}>
  <label>
    <input
      type="checkbox"
      checked={formEdicao.kitHigiene || false}
      onChange={e => setFormEdicao(p => ({ ...p, kitHigiene: e.target.checked, qtdKitHigiene: '' }))}
      style={{ marginRight: 8 }}
    />
    🧴 Kit Higiene distribuído
  </label>
</div>

{formEdicao.kitHigiene && (
  <div className={styles.campo}>
    <label>🧴 Quantidade de Kits Higiene</label>
    <input
      type="number"
      min="0"
      value={formEdicao.qtdKitHigiene || ''}
      onChange={e => setFormEdicao(p => ({ ...p, qtdKitHigiene: e.target.value }))}
      placeholder="0"
    />
  </div>
)}
            <div className={styles.campo}>
              <label>📝 Observações</label>
              <textarea
                rows={3}
                value={formEdicao.observacoes}
                onChange={e => setFormEdicao(p => ({ ...p, observacoes: e.target.value }))}
                placeholder="Observações opcionais..."
              />
            </div>

            {erroEdicao && <p className={styles.erro}>⚠️ {erroEdicao}</p>}

            <div className={styles.modalAcoes}>
              <button className={styles.btnSecundario} onClick={() => setEditando(null)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={salvarEdicao} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
