import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';
import { formatarData } from '../utils/datas';
import styles from './Dashboard.module.css';

const CARDS = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',       emoji: '🍱' },
  { key: 'qtdAguas',           label: 'Águas',             emoji: '💧' },
  { key: 'qtdBananadasGarfos', label: 'Bananadas',         emoji: '🍌' },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas', emoji: '🤝' },
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Dashboard() {
  const [distribuicoes, setDistribuicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [anoFiltro, setAnoFiltro] = useState('todos');
  const [mesFiltro, setMesFiltro] = useState('todos');

  useEffect(() => {
    api.get('/distribuicoes').then(({ data }) => {
      setDistribuicoes(data);
    }).finally(() => setCarregando(false));
  }, []);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(distribuicoes.map(d => new Date(d.data).getUTCFullYear()));
    return Array.from(anos).sort((a, b) => b - a);
  }, [distribuicoes]);

  const distribuicoesFiltradas = useMemo(() => {
    return distribuicoes.filter(d => {
      const data = new Date(d.data);
      const ano = data.getUTCFullYear();
      const mes = data.getUTCMonth();
      if (anoFiltro !== 'todos' && ano !== Number(anoFiltro)) return false;
      if (mesFiltro !== 'todos' && mes !== Number(mesFiltro)) return false;
      return true;
    });
  }, [distribuicoes, anoFiltro, mesFiltro]);

  const totais = distribuicoesFiltradas.reduce((acc, d) => {
    CARDS.forEach(c => { acc[c.key] = (acc[c.key] || 0) + d[c.key]; });
    return acc;
  }, {});

  // Estatísticas gerais (sempre sobre o ano selecionado, ou ano corrente se "todos")
  const anoEstatisticas = anoFiltro !== 'todos' ? Number(anoFiltro) : new Date().getUTCFullYear();
  const distribuicoesDoAno = distribuicoes.filter(d => new Date(d.data).getUTCFullYear() === anoEstatisticas);

  const quentinhasNoAno = distribuicoesDoAno.reduce((acc, d) => acc + d.qtdQuentinhas, 0);

  const diaMaiorEntrega = distribuicoes.reduce((maior, d) => {
    if (!maior || d.qtdQuentinhas > maior.qtdQuentinhas) return d;
    return maior;
  }, null);

  const mediaAtendidosPorDistribuicao = distribuicoesFiltradas.length > 0
    ? Math.round(distribuicoesFiltradas.reduce((acc, d) => acc + d.pessoasAtendidas, 0) / distribuicoesFiltradas.length)
    : 0;

  const dadosGrafico = [...distribuicoesFiltradas]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map(d => ({
      data: formatarData(d.data),
      Quentinhas: d.qtdQuentinhas,
      'Pessoas atendidas': d.pessoasAtendidas,
      Águas: d.qtdAguas,
      Repetições: d.qtdRepeticoes,
    }));

  if (carregando) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Dashboard</h1>
        <span className={styles.total}>{distribuicoesFiltradas.length} distribuições no período selecionado</span>
      </div>

      <div className={styles.filtros}>
        <div className={styles.filtroCampo}>
          <label>Ano</label>
          <select value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)}>
            <option value="todos">Todos os anos</option>
            {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
          </select>
        </div>
        <div className={styles.filtroCampo}>
          <label>Mês</label>
          <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}>
            <option value="todos">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        {(anoFiltro !== 'todos' || mesFiltro !== 'todos') && (
          <button className={styles.limparFiltro} onClick={() => { setAnoFiltro('todos'); setMesFiltro('todos'); }}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className={styles.cards}>
        {CARDS.map(c => (
          <div key={c.key} className={styles.card}>
            <span className={styles.cardEmoji}>{c.emoji}</span>
            <span className={styles.cardValor}>{(totais[c.key] || 0).toLocaleString('pt-BR')}</span>
            <span className={styles.cardLabel}>{c.label} no período</span>
          </div>
        ))}
      </div>

      <div className={styles.estatisticas}>
        <h2>Estatísticas gerais</h2>
        <div className={styles.statsGrade}>
          <div className={styles.statCard}>
            <span className={styles.statEmoji}>🏆</span>
            <div>
              <span className={styles.statLabel}>Dia com maior entrega de quentinhas</span>
              <span className={styles.statValor}>
                {diaMaiorEntrega ? `${diaMaiorEntrega.qtdQuentinhas} em ${formatarData(diaMaiorEntrega.data)}` : '—'}
              </span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statEmoji}>📅</span>
            <div>
              <span className={styles.statLabel}>Quentinhas totais em {anoEstatisticas}</span>
              <span className={styles.statValor}>{quentinhasNoAno.toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statEmoji}>📊</span>
            <div>
              <span className={styles.statLabel}>Média de atendidos por distribuição (período)</span>
              <span className={styles.statValor}>{mediaAtendidosPorDistribuicao}</span>
            </div>
          </div>
        </div>
      </div>

      {dadosGrafico.length > 0 ? (
        <>
          <div className={styles.grafico}>
            <h2>Evolução — Quentinhas e Pessoas atendidas</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D0B0" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#6B4226' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4226' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8D0B0', fontFamily: 'Nunito' }} />
                <Legend />
                <Line type="monotone" dataKey="Quentinhas" stroke="#E8521A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Pessoas atendidas" stroke="#F5A623" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.grafico}>
            <h2>Comparativo por distribuição</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D0B0" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#6B4226' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4226' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8D0B0', fontFamily: 'Nunito' }} />
                <Legend />
                <Bar dataKey="Quentinhas" fill="#E8521A" radius={[4,4,0,0]} />
                <Bar dataKey="Águas" fill="#F28C28" radius={[4,4,0,0]} />
                <Bar dataKey="Repetições" fill="#F7C948" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className={styles.vazio}>
          Nenhuma distribuição encontrada para o período selecionado.
        </div>
      )}
    </div>
  );
}
