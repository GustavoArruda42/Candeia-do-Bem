import { useEffect, useState } from 'react';
import api from '../services/api';
import { formatarDataHora } from '../utils/datas';
import styles from './Usuarios.module.css';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState({ username: '', senha: '', role: 'membro' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);

  const carregar = () => {
    api.get('/auth/usuarios').then(({ data }) => setUsuarios(data)).finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const cadastrar = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso('');
    try {
      await api.post('/auth/usuarios', form);
      setSucesso(`Usuário "${form.username}" criado com sucesso.`);
      setForm({ username: '', senha: '', role: 'membro' });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar usuário');
    }
  };

  const remover = async (id) => {
    try {
      await api.delete(`/auth/usuarios/${id}`);
      setConfirmandoId(null);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao remover');
    }
  };

  return (
    <div className={styles.pagina}>
      <h1>Gerenciar Usuários</h1>

      <div className={styles.card}>
        <h2>Adicionar usuário</h2>
        <form className={styles.form} onSubmit={cadastrar}>
          <div className={styles.grade}>
            <div className={styles.campo}>
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                placeholder="nome de usuário"
              />
            </div>
            <div className={styles.campo}>
              <label>Senha</label>
              <input
                type="password"
                value={form.senha}
                onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                required
                placeholder="senha inicial"
              />
            </div>
            <div className={styles.campo}>
              <label>Perfil</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="membro">Membro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {erro && <p className={styles.erro}>⚠️ {erro}</p>}
          {sucesso && <p className={styles.sucesso}>✅ {sucesso}</p>}
          <button className={styles.btnPrimario} type="submit">Criar usuário</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Usuários cadastrados</h2>
        {carregando ? <p>Carregando...</p> : (
          <div className={styles.tabelaWrap}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Perfil</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u._id}>
                    <td className={styles.username}>
                      {u.username} {u._id === eu?.id && <span className={styles.voce}>(você)</span>}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.role === 'admin' ? styles.admin : styles.membro}`}>
                        {u.role === 'admin' ? '⭐ Admin' : '👤 Membro'}
                      </span>
                    </td>
                    <td className={styles.data}>{formatarDataHora(u.createdAt)}</td>
                    <td>
                      {u._id !== eu?.id && (
                        confirmandoId === u._id ? (
                          <span className={styles.confirmar}>
                            Confirmar?{' '}
                            <button className={styles.btnSim} onClick={() => remover(u._id)}>Sim</button>{' '}
                            <button className={styles.btnNao} onClick={() => setConfirmandoId(null)}>Não</button>
                          </span>
                        ) : (
                          <button className={styles.btnRemover} onClick={() => setConfirmandoId(u._id)}>Remover</button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
