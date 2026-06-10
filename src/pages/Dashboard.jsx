import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';
import { formatarData } from '../utils/datas';
import styles from './Dashboard.module.css';

const CARDS = [
  { key: 'qtdQuentinhas',      label: 'Quentinhas',       emoji: '🍱' },
  { key: 'qtdAguas',           label: 'Águas',             emoji: '💧' },
  { key: 'qtdBananadasGarfos', label: 'Bananadas',         emoji: '🍌' },
  { key: 'pessoasAtendidas',   label: 'Pessoas atendidas', emoji: '🤝' },
  { key: 'qtdKitHigiene',      label: 'Kits Higiene',      emoji: '🧴' },
  { key: 'racaoCachorro', label: 'Ração Cachorro', emoji: '🐶' },
  { key: 'racaoGato',     label: 'Ração Gato',     emoji: '🐱' },
];

export default function Dashboard() {
  const [distribuicoes, setDistribuicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get('/distribuicoes').then(({ data }) => {
      setDistribuicoes(data);
    }).finally(() => setCarregando(false));
  }, []);

  const totais = distribuicoes.reduce((acc, d) => {
    CARDS.forEach(c => { acc[c.key] = (acc[c.key] || 0) + d[c.key]; });
    return acc;
  }, {});

  const dadosGrafico = [...distribuicoes]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(-12)
    .map(d => ({
      data: formatarData(d.data),
      Quentinhas: d.qtdQuentinhas,
      'Pessoas atendidas': d.pessoasAtendidas,
      Águas: d.qtdAguas,
      Repetições: d.qtdRepeticoes,
      'Kits Higiene': d.qtdKitHigiene,
      'Ração Cachorro': d.racaoCachorro,
      'Ração Gato': d.racaoGato
    }));

  if (carregando) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <h1>Dashboard</h1>
        <span className={styles.total}>{distribuicoes.length} distribuições registradas</span>
      </div>

      <div className={styles.cards}>
        {CARDS.map(c => (
          <div key={c.key} className={styles.card}>
            <span className={styles.cardEmoji}>{c.emoji}</span>
            <span className={styles.cardValor}>{(totais[c.key] || 0).toLocaleString('pt-BR')}</span>
            <span className={styles.cardLabel}>{c.label} no total</span>
          </div>
        ))}
      </div>

      {dadosGrafico.length > 0 && (
        <>
          <div className={styles.grafico}>
            <h2>Evolução semanal — Quentinhas e Pessoas atendidas</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D0B0" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#6B4226' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4226' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8D0B0', fontFamily: 'Nunito' }} />
                <Legend />
                <Line type="monotone" dataKey="Quentinhas" stroke="#E8521A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Pessoas atendidas" stroke="#F5A623" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Águas" stroke="#E8521A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Repetições" stroke="#F5A623" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Kits Higiene" stroke="#096cee" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Ração Gato" stroke="#0400ff9c" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Ração Cachorro" stroke="#188118" strokeWidth={2.5} dot={{ r: 4 }} />
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
                <Bar dataKey="Kits Higiene" fill="#096cee" radius={[4,4,0,0]} />
                <Bar dataKey="Ração Gato" fill="#0400ff9c" radius={[4,4,0,0]} />
                <Bar dataKey="Ração Cachorro" fill="#188118" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {distribuicoes.length === 0 && (
        <div className={styles.vazio}>
          Nenhuma distribuição registrada ainda. <a href="/registro">Registre a primeira!</a>
        </div>
      )}
    </div>
  );
}
