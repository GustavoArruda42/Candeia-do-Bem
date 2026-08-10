import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Escala.module.css';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const getDomingosMes = (mes, ano) => {
  const domingos = [];
  const data = new Date(ano, mes - 1, 1);
  while (data.getDay() !== 0) data.setDate(data.getDate() + 1);
  while (data.getMonth() === mes - 1) {
    domingos.push(new Date(data));
    data.setDate(data.getDate() + 7);
  }
  return domingos;
};

const formatarData = (data) => {
  const d = new Date(data);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function Escala() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'admin';
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const [integrantes, setIntegrantes] = useState([]);
  const [cozinheiras, setCozinheiras] = useState([]);
  const [escala, setEscala] = useState(null); // domingos: [{data, alocacoes, cozinheiras}]
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Drag state
  const [dragging, setDragging] = useState(null); // {tipo:'integrante'|'cozinheira', id, nome, tipoIntegrante}
  const [dragOver, setDragOver] = useState(null); // {domingoIdx, secao}

  // Gestão de integrantes/cozinheiras (admin)
  const [modalGestao, setModalGestao] = useState(null); // 'integrantes' | 'cozinheiras'
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState('motorista');
  const [erroModal, setErroModal] = useState('');

  const domingos = getDomingosMes(mes, ano);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resInt, resCoz, resEsc] = await Promise.all([
        api.get('/integrantes'),
        api.get('/cozinheiras'),
        api.get(`/escalas?mes=${mes}&ano=${ano}`)
      ]);
      setIntegrantes(resInt.data);
      setCozinheiras(resCoz.data);

      if (resEsc.data) {
        // Normaliza os domingos vindos do banco para o formato local
        const domingosSalvos = {};
        resEsc.data.domingos.forEach(d => {
          const key = new Date(d.data).toISOString().split('T')[0];
          domingosSalvos[key] = {
            alocacoes: d.alocacoes.map(a => ({
              id: a.integrante._id,
              nome: a.integrante.nome,
              tipo: a.integrante.tipo,
              role: a.role
            })),
            cozinheiras: d.cozinheiras.map(c => ({
              id: c.cozinheira._id,
              nome: c.cozinheira.nome,
              qtdQuentinhas: c.qtdQuentinhas
            }))
          };
        });
        setEscala(domingosSalvos);
      } else {
        setEscala({});
      }
    } catch {
      setErro('Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  }, [mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const getDomingo = (data) => {
    const key = data.toISOString().split('T')[0];
    return escala?.[key] || { alocacoes: [], cozinheiras: [] };
  };

  const setDomingo = (data, valor) => {
    const key = data.toISOString().split('T')[0];
    setEscala(prev => ({ ...prev, [key]: valor }));
  };

  // Drag handlers — integrantes
  const onDragStartIntegrante = (e, integrante) => {
    setDragging({ tipo: 'integrante', id: integrante._id, nome: integrante.nome, tipoIntegrante: integrante.tipo });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragStartCozinheira = (e, cozinheira) => {
    setDragging({ tipo: 'cozinheira', id: cozinheira._id, nome: cozinheira.nome });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragOver = (e, domingoIdx, secao) => {
    e.preventDefault();
    setDragOver({ domingoIdx, secao });
  };

  const onDrop = (e, domingoData, secao) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging) return;

    const d = getDomingo(domingoData);

    if (secao === 'distribuicao' && dragging.tipo === 'integrante') {
      const jaEsta = d.alocacoes.some(a => a.id === dragging.id);
      if (jaEsta) return;

      // Se o integrante é ajudante, role padrão é ajudante
      // Se é motorista, verifica se já tem 2 motoristas; se tiver, entra como ajudante
      const motoristaCount = d.alocacoes.filter(a => a.role === 'motorista').length;
      const role = dragging.tipoIntegrante === 'motorista' && motoristaCount < 2 ? 'motorista' : 'ajudante';

      setDomingo(domingoData, {
        ...d,
        alocacoes: [...d.alocacoes, { id: dragging.id, nome: dragging.nome, tipo: dragging.tipoIntegrante, role }]
      });
    }

    if (secao === 'cozinheiras' && dragging.tipo === 'cozinheira') {
      const jaEsta = d.cozinheiras.some(c => c.id === dragging.id);
      if (jaEsta) return;
      setDomingo(domingoData, {
        ...d,
        cozinheiras: [...d.cozinheiras, { id: dragging.id, nome: dragging.nome, qtdQuentinhas: 0 }]
      });
    }

    setDragging(null);
  };

  const removerAlocacao = (domingoData, integranteId) => {
    const d = getDomingo(domingoData);
    setDomingo(domingoData, { ...d, alocacoes: d.alocacoes.filter(a => a.id !== integranteId) });
  };

  const removerCozinheira = (domingoData, cozinheiraId) => {
    const d = getDomingo(domingoData);
    setDomingo(domingoData, { ...d, cozinheiras: d.cozinheiras.filter(c => c.id !== cozinheiraId) });
  };

  const toggleRole = (domingoData, integranteId) => {
    const d = getDomingo(domingoData);
    const integrante = d.alocacoes.find(a => a.id === integranteId);
    if (!integrante || integrante.tipo === 'ajudante') return; // ajudantes não podem ser motoristas
    setDomingo(domingoData, {
      ...d,
      alocacoes: d.alocacoes.map(a =>
        a.id === integranteId ? { ...a, role: a.role === 'motorista' ? 'ajudante' : 'motorista' } : a
      )
    });
  };

  const atualizarQtdCozinheira = (domingoData, cozinheiraId, qtd) => {
    const d = getDomingo(domingoData);
    setDomingo(domingoData, {
      ...d,
      cozinheiras: d.cozinheiras.map(c =>
        c.id === cozinheiraId ? { ...c, qtdQuentinhas: Number(qtd) || 0 } : c
      )
    });
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      const domingosMontados = domingos.map(d => {
        const info = getDomingo(d);
        return {
          data: d.toISOString(),
          alocacoes: info.alocacoes.map(a => ({ integrante: a.id, role: a.role })),
          cozinheiras: info.cozinheiras.map(c => ({ cozinheira: c.id, qtdQuentinhas: c.qtdQuentinhas }))
        };
      });

      await api.post('/escalas', { mes, ano, domingos: domingosMontados });
      setSucesso('Escala salva com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar escala');
    } finally {
      setSalvando(false);
    }
  };

  // Contador anual de participações
  const contagemAnual = {};
  integrantes.forEach(i => { contagemAnual[i._id] = 0; });

  // Contador mensal para alerta de dupla participação
  const contagemMensal = {};
  integrantes.forEach(i => { contagemMensal[i._id] = 0; });

  const [contagemAnualReal, setContagemAnualReal] = useState({});

useEffect(() => {
  const buscarAnual = async () => {
    const contagem = {};
    integrantes.forEach(i => { contagem[i._id] = 0; });
    try {
      for (let m = 1; m <= 12; m++) {
        const res = await api.get(`/escalas?mes=${m}&ano=${ano}`);
        if (res.data) {
          res.data.domingos.forEach(d => {
            d.alocacoes.forEach(a => {
              const id = a.integrante._id || a.integrante;
              contagem[id] = (contagem[id] || 0) + 1;
            });
          });
        }
      }
    } catch {}
    setContagemAnualReal(contagem);
  };
  if (integrantes.length > 0) buscarAnual();
}, [integrantes, ano]);

  if (escala) {
    domingos.forEach(d => {
      const info = getDomingo(d);
      info.alocacoes.forEach(a => {
        contagemMensal[a.id] = (contagemMensal[a.id] || 0) + 1;
      });
    });
  }

  // Gestão modal
  const criarIntegrante = async () => {
    if (!novoNome.trim()) { setErroModal('Nome obrigatório'); return; }
    try {
      await api.post('/integrantes', { nome: novoNome.trim(), tipo: novoTipo });
      setNovoNome('');
      setErroModal('');
      carregar();
    } catch { setErroModal('Erro ao criar'); }
  };

  const criarCozinheira = async () => {
    if (!novoNome.trim()) { setErroModal('Nome obrigatório'); return; }
    try {
      await api.post('/cozinheiras', { nome: novoNome.trim() });
      setNovoNome('');
      setErroModal('');
      carregar();
    } catch { setErroModal('Erro ao criar'); }
  };

  const removerIntegrante = async (id) => {
    await api.delete(`/integrantes/${id}`);
    carregar();
  };

  const removerCozinheiraGestao = async (id) => {
    await api.delete(`/cozinheiras/${id}`);
    carregar();
  };

  if (carregando) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.pagina}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Escala</h1>
        <div className={styles.headerAcoes}>
          {isAdmin && (
            <>
              <button className={styles.btnGestao} onClick={() => { setModalGestao('integrantes'); setNovoNome(''); setErroModal(''); }}>
                👥 Gerir integrantes
              </button>
              <button className={styles.btnGestao} onClick={() => { setModalGestao('cozinheiras'); setNovoNome(''); setErroModal(''); }}>
                👩‍🍳 Gerir cozinheiras
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navegação de mês */}
      <div className={styles.navMes}>
        <button className={styles.btnNav} onClick={() => {
          if (mes === 1) { setMes(12); setAno(a => a - 1); } else setMes(m => m - 1);
        }}>‹</button>
        <span className={styles.mesLabel}>{MESES[mes - 1]} {ano}</span>
        <button className={styles.btnNav} onClick={() => {
          if (mes === 12) { setMes(1); setAno(a => a + 1); } else setMes(m => m + 1);
        }}>›</button>
      </div>

      {erro && <p className={styles.erro}>⚠️ {erro}</p>}
      {sucesso && <p className={styles.sucesso}>✅ {sucesso}</p>}

      {/* Seção Distribuição */}
      <div className={styles.secaoLabel}>Distribuição — motoristas e ajudantes</div>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitulo}>Integrantes <span className={styles.contadorTotal}>({integrantes.length})</span></div>
          {integrantes.map(i => (
            <div
              key={i._id}
              className={styles.chip}
              draggable={isAdmin}
              onDragStart={e => onDragStartIntegrante(e, i)}
            >
              <span className={styles.chipNome}>{i.nome}</span>
              <span className={`${styles.badge} ${i.tipo === 'motorista' ? styles.badgeM : styles.badgeA}`}>
                {i.tipo === 'motorista' ? 'M' : 'A'}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.gradeScroll}>
          <div className={styles.domingos}>
            {domingos.map((d, idx) => {
              const info = getDomingo(d);
              const motoristas = info.alocacoes.filter(a => a.role === 'motorista').length;
              const isDragOver = dragOver?.domingoIdx === idx && dragOver?.secao === 'distribuicao';
              return (
                <div key={idx} className={styles.dia}>
                  <div className={styles.diaHeader}>
                    <span className={styles.diaData}>{formatarData(d)}</span>
                    <span className={styles.diaSub}>Domingo {idx + 1}</span>
                  </div>
                  <div
                    className={`${styles.dropZone} ${isDragOver ? styles.dropZoneOver : ''}`}
                    onDragOver={e => onDragOver(e, idx, 'distribuicao')}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, d, 'distribuicao')}
                  >
                    {info.alocacoes.length === 0 && (
                      <span className={styles.dropHint}>Arraste integrantes</span>
                    )}
                    {info.alocacoes.map(a => (
                      <div key={a.id} className={styles.alocado}>
                        <span className={styles.alocadoNome}>{a.nome}</span>
                        <div className={styles.alocadoAcoes}>
                          {isAdmin && (
                            <button
                              className={`${styles.badgeBtn} ${a.role === 'motorista' ? styles.badgeM : styles.badgeA}`}
                              onClick={() => toggleRole(d, a.id)}
                              title={a.tipo === 'ajudante' ? 'Só ajudante' : 'Clique para alternar role'}
                              disabled={a.tipo === 'ajudante'}
                            >
                              {a.role === 'motorista' ? 'M' : 'A'}
                            </button>
                          )}
                          {!isAdmin && (
                            <span className={`${styles.badge} ${a.role === 'motorista' ? styles.badgeM : styles.badgeA}`}>
                              {a.role === 'motorista' ? 'M' : 'A'}
                            </span>
                          )}
                          {isAdmin && (
                            <button className={styles.btnRemAlocado} onClick={() => removerAlocacao(d, a.id)}>✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {motoristas !== 2 && info.alocacoes.length > 0 && (
                      <span className={styles.avisoMotorista}>
                        ⚠️ {motoristas < 2 ? `Falta ${2 - motoristas} motorista(s)` : 'Motoristas em excesso'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seção Cozinheiras */}
      <div className={styles.sidebarTitulo}>Cozinheiras <span className={styles.contadorTotal}>({cozinheiras.length})</span></div>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          {cozinheiras.map(c => (
            <div
              key={c._id}
              className={styles.chip}
              draggable={isAdmin}
              onDragStart={e => onDragStartCozinheira(e, c)}
            >
              <span className={styles.chipNome}>{c.nome}</span>
            </div>
          ))}
        </div>

        <div className={styles.gradeScroll}>
          <div className={styles.domingos}>
            {domingos.map((d, idx) => {
              const info = getDomingo(d);
              const isDragOver = dragOver?.domingoIdx === idx && dragOver?.secao === 'cozinheiras';
              return (
                <div key={idx} className={styles.dia}>
                  <div className={styles.diaHeader}>
                    <span className={styles.diaData}>{formatarData(d)}</span>
                    <span className={styles.diaSub}>Domingo {idx + 1}</span>
                  </div>
                  <div
                    className={`${styles.dropZone} ${isDragOver ? styles.dropZoneOver : ''}`}
                    onDragOver={e => onDragOver(e, idx, 'cozinheiras')}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, d, 'cozinheiras')}
                  >
                    {info.cozinheiras.length === 0 && (
                      <span className={styles.dropHint}>Arraste cozinheiras</span>
                    )}
                    {info.cozinheiras.map(c => (
                      <div key={c.id} className={styles.alocado}>
                        <span className={styles.alocadoNome}>{c.nome}</span>
                        <div className={styles.alocadoAcoes}>
                          <input
                            type="number"
                            min="0"
                            value={c.qtdQuentinhas}
                            onChange={e => atualizarQtdCozinheira(d, c.id, e.target.value)}
                            className={styles.inputQtd}
                            disabled={!isAdmin}
                            title="Quentinhas"
                          />
                          {isAdmin && (
                            <button className={styles.btnRemAlocado} onClick={() => removerCozinheira(d, c.id)}>✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      {isAdmin && (
        <div className={styles.salvarRow}>
          <button className={styles.btnSalvar} onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : '💾 Salvar escala'}
          </button>
        </div>
      )}

      {/* Contador mensal */}
      <div className={styles.secaoLabel} style={{ marginTop: '1.5rem' }}>Participações em {MESES[mes - 1]}</div>
      <div className={styles.contadores}>
        {integrantes.map(i => {
          const count = contagemMensal[i._id] || 0;
          const dupla = count >= 2;
          return (
            <div key={i._id} className={`${styles.counterChip} ${dupla ? styles.counterDupla : ''}`}>
              <span className={styles.counterNum}>{count}</span>
              <span className={styles.counterNome}>{i.nome}</span>
              {dupla && <span className={styles.counterAviso} title="2 ou mais participações neste mês">●</span>}
            </div>
          );
        })}
      </div>
      <div className={styles.secaoLabel} style={{ marginTop: '1rem' }}>Participações em {ano}</div>
      <div className={styles.contadores}>
        {integrantes.map(i => (
          <div key={i._id} className={styles.counterChip}>
            <span className={styles.counterNum}>{contagemAnualReal[i._id] || 0}</span>
            <span className={styles.counterNome}>{i.nome}</span>
          </div>
        ))}
      </div>
      
      {/* Modal gestão integrantes */}
      {modalGestao === 'integrantes' && (
        <div className={styles.overlay} onClick={() => setModalGestao(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTopo}>
              <h2>Gerir integrantes</h2>
              <button className={styles.fechar} onClick={() => setModalGestao(null)}>✕</button>
            </div>
            <div className={styles.modalForm}>
              <input
                type="text"
                placeholder="Nome do integrante"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && criarIntegrante()}
              />
              <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)}>
                <option value="motorista">Motorista</option>
                <option value="ajudante">Ajudante</option>
              </select>
              <button className={styles.btnAdicionar} onClick={criarIntegrante}>Adicionar</button>
            </div>
            {erroModal && <p className={styles.erro}>{erroModal}</p>}
            <div className={styles.listaGestao}>
              {integrantes.map(i => (
                <div key={i._id} className={styles.itemGestao}>
                  <span>{i.nome}</span>
                  <span className={`${styles.badge} ${i.tipo === 'motorista' ? styles.badgeM : styles.badgeA}`}>
                    {i.tipo === 'motorista' ? 'Motorista' : 'Ajudante'}
                  </span>
                  <button className={styles.btnRemGestao} onClick={() => removerIntegrante(i._id)}>Remover</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal gestão cozinheiras */}
      {modalGestao === 'cozinheiras' && (
        <div className={styles.overlay} onClick={() => setModalGestao(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTopo}>
              <h2>Gerir cozinheiras</h2>
              <button className={styles.fechar} onClick={() => setModalGestao(null)}>✕</button>
            </div>
            <div className={styles.modalForm}>
              <input
                type="text"
                placeholder="Nome da cozinheira"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && criarCozinheira()}
              />
              <button className={styles.btnAdicionar} onClick={criarCozinheira}>Adicionar</button>
            </div>
            {erroModal && <p className={styles.erro}>{erroModal}</p>}
            <div className={styles.listaGestao}>
              {cozinheiras.map(c => (
                <div key={c._id} className={styles.itemGestao}>
                  <span>{c.nome}</span>
                  <button className={styles.btnRemGestao} onClick={() => removerCozinheiraGestao(c._id)}>Remover</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
