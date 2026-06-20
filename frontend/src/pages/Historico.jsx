import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatarData, formatarDataHora } from '../utils/datas';
import styles from './Historico.module.css';

const CAMPOS = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',            emoji: '🍱' },
  { key: 'qtdAguas',           label: 'Águas',                 emoji: '💧' },
  { key: 'qtdBananadasGarfos', label: 'Bananadas + Garfos',    emoji: '🍌' },
  { key: 'qtdGarfos',          label: 'Garfos avulsos',        emoji: '🍴' },
  { key: 'pessoasPresentes',   label: 'Voluntários presentes', emoji: '🙋' },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas',     emoji: '🤝' },
  { key: 'qtdRepeticoes',      label: 'Repetições',            emoji: '🔁' },
  { key: 'racaoCachorro',      label: 'Ração Cachorro',        emoji: '🐶' },
  { key: 'racaoGato',          label: 'Ração Gato',            emoji: '🐱' },
  { key: 'qtdSabonete',        label: 'Sabonete',              emoji: '🧼' },
  { key: 'qtdPastaDente',      label: 'Pasta de dente',        emoji: '🪥' },
  { key: 'qtdEscovaDente',     label: 'Escova de dente',       emoji: '🦷' },
  { key: 'qtdAbsorvente',      label: 'Absorvente',            emoji: '🩹' },
  { key: 'qtdPapelHigienico',  label: 'Papel higiênico',       emoji: '🧻' },
];

export default function Historico() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [distribuicoes, setDistribuicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [editando, setEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');
  const [expandido, setExpandido] = useState(null);

  const carregar = () => {
    api.get('/distribuicoes').then(({ data }) => setDistribuicoes(data)).finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const podeEditar = (d) =>
    usuario?.role === 'admin' || d.registradoPor?._id === usuario?.id;

  const abrirEdicao = (d) => {
    setEditando(d);
    setErroEdicao('');
    const dados = { observacoes: d.observacoes || '' };
    CAMPOS.forEach(c => { dados[c.key] = d[c.key] ?? 0; });
    setFormEdicao(dados);
  };

  const salvarEdicao = async () => {
    setSalvando(true);
    setErroEdicao('');
    try {
      const payload = { observacoes: formEdicao.observacoes };
      CAMPOS.forEach(c => { payload[c.key] = Number(formEdicao[c.key]) || 0; });

      await api.put(`/distribuicoes/${editando._id}`, payload);
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
                <th></th>
                <th>Data</th>
                <th>🍱 Quentinhas</th>
                <th>💧 Águas</th>
                <th>🍌 Bananadas</th>
                <th>🤝 Atendidos</th>
                <th>Registrado por</th>
                <th>Registrado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {distribuicoes.map(d => (
                <>
                  <tr key={d._id}>
                    <td>
                      <button
                        className={styles.btnExpandir}
                        onClick={() => setExpandido(expandido === d._id ? null : d._id)}
                        title="Ver detalhes"
                      >
                        {expandido === d._id ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className={styles.destaque}>{formatarData(d.data)}</td>
                    <td>{d.qtdQuentinhas}</td>
                    <td>{d.qtdAguas}</td>
                    <td>{d.qtdBananadasGarfos}</td>
                    <td>{d.pessoasAtendidas}</td>
                    <td>{d.registradoPor?.username || '—'}</td>
                    <td className={styles.datahora}>{formatarDataHora(d.createdAt)}</td>
                    <td>
                      {podeEditar(d) && (
                        <div className={styles.acoes}>
                          <button className={styles.btnEditar} onClick={() => abrirEdicao(d)}>Editar</button>
                          {confirmandoId === d._id ? (
                            <span className={styles.confirmar}>
                              Confirmar?{' '}
                              <button className={styles.btnSim} onClick={() => remover(d._id)}>Sim</button>{' '}
                              <button className={styles.btnNao} onClick={() => setConfirmandoId(null)}>Não</button>
                            </span>
                          ) : (
                            <button className={styles.btnRemover} onClick={() => setConfirmandoId(d._id)}>Excluir</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandido === d._id && (
                    <tr className={styles.linhaDetalhe}>
                      <td colSpan={9}>
                        <div className={styles.detalhe}>
                          <div className={styles.detalheGrade}>
                            {CAMPOS.map(c => (
                              <span key={c.key} className={styles.detalheItem}>
                                <strong>{c.emoji} {c.label}:</strong> {d[c.key] ?? 0}
                              </span>
                            ))}
                          </div>
                          <div className={styles.detalheObs}>
                            <strong>📝 Observações:</strong>{' '}
                            {d.observacoes ? d.observacoes : <em>Nenhuma observação registrada.</em>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
