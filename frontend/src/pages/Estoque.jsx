import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatarDataHora } from '../utils/datas';
import styles from './Estoque.module.css';

const ROTULOS = {
  aguas:            { label: 'Águas',              emoji: '💧' },
  bananadasGarfos:  { label: 'Bananadas + Garfos',  emoji: '🍌' },
  garfos:           { label: 'Garfos avulsos',      emoji: '🍴' },
  sabonete:         { label: 'Sabonete',            emoji: '🧼' },
  pastaDente:       { label: 'Pasta de dente',      emoji: '🪥' },
  escovaDente:      { label: 'Escova de dente',     emoji: '🦷' },
  absorvente:       { label: 'Absorvente',          emoji: '🩹' },
  papelHigienico:   { label: 'Papel higiênico',     emoji: '🧻' },
  racaoCachorro: { label: 'Ração Cachorro', emoji: '🐶' },
  racaoGato:     { label: 'Ração Gato',     emoji: '🐱' },
};

export default function Estoque() {
  const { usuario } = useAuth();
  const [itens, setItens] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const [modalItem, setModalItem] = useState(null);
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = () => {
    setCarregando(true);
    Promise.all([
      api.get('/estoque'),
      api.get('/estoque/historico'),
    ]).then(([resEstoque, resHistorico]) => {
      setItens(resEstoque.data);
      setHistorico(resHistorico.data);
    }).finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirEntrada = (item) => {
    setModalItem(item);
    setQuantidade('');
    setMotivo('');
    setErro('');
  };

  const confirmarEntrada = async () => {
    if (!quantidade || Number(quantidade) <= 0) {
      setErro('Informe uma quantidade válida');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await api.post('/estoque/entrada', {
        item: modalItem.item,
        quantidade: Number(quantidade),
        motivo,
      });
      setModalItem(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao registrar entrada');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Estoque</h1>
        <p>Itens consumidos automaticamente a cada distribuição registrada</p>
      </div>

      <div className={styles.grade}>
        {itens.map(i => {
          const rotulo = ROTULOS[i.item] || { label: i.item, emoji: '📦' };
          const baixo = i.quantidade <= i.estoqueMinimo;
          return (
            <div key={i.item} className={`${styles.card} ${baixo ? styles.cardBaixo : ''}`}>
              <span className={styles.cardEmoji}>{rotulo.emoji}</span>
              <span className={styles.cardLabel}>{rotulo.label}</span>
              <span className={styles.cardValor}>{i.quantidade}</span>
              {baixo && <span className={styles.alerta}>⚠️ Estoque baixo</span>}
              {usuario?.role === 'admin' && (
                <button className={styles.btnEntrada} onClick={() => abrirEntrada(i)}>
                  + Adicionar entrada
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.secaoHistorico}>
        <button className={styles.toggleHistorico} onClick={() => setMostrarHistorico(p => !p)}>
          {mostrarHistorico ? '▾' : '▸'} Histórico de movimentações
        </button>

        {mostrarHistorico && (
          <div className={styles.tabelaWrap}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Por</th>
                </tr>
              </thead>
              <tbody>
                {historico.map(m => (
                  <tr key={m._id}>
                    <td className={styles.datahora}>{formatarDataHora(m.createdAt)}</td>
                    <td>{ROTULOS[m.item]?.emoji} {ROTULOS[m.item]?.label || m.item}</td>
                    <td>
                      <span className={`${styles.badge} ${m.tipo === 'entrada' ? styles.entrada : styles.saida}`}>
                        {m.tipo === 'entrada' ? '⬆️ Entrada' : '⬇️ Saída'}
                      </span>
                    </td>
                    <td>{m.quantidade}</td>
                    <td>{m.motivo || '—'}</td>
                    <td>{m.registradoPor?.username || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalItem && (
        <div className={styles.overlay} onClick={() => setModalItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTopo}>
              <h2>{ROTULOS[modalItem.item]?.emoji} Adicionar entrada — {ROTULOS[modalItem.item]?.label}</h2>
              <button className={styles.fechar} onClick={() => setModalItem(null)}>✕</button>
            </div>

            <div className={styles.campo}>
              <label>Quantidade recebida</label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>

            <div className={styles.campo}>
              <label>Motivo / origem <span className={styles.opcional}>(opcional)</span></label>
              <input
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: doação da campanha de inverno"
              />
            </div>

            {erro && <p className={styles.erro}>⚠️ {erro}</p>}

            <div className={styles.modalAcoes}>
              <button className={styles.btnSecundario} onClick={() => setModalItem(null)}>Cancelar</button>
              <button className={styles.btnPrimario} onClick={confirmarEntrada} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Confirmar entrada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
