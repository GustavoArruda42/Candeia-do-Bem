import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const { data } = await api.post('/auth/login', { username, senha });
      login(data.token, data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.card}>
        <div className={styles.topo}>
          <span className={styles.chama}>🕯️</span>
          <h1 className={styles.titulo}>Candeia do Bem</h1>
          <p className={styles.sub}>Centro Espírita Amaral Ornellas</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.campo}>
            <label>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seu usuário"
              required
            />
          </div>
          <div className={styles.campo}>
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {erro && <p className={styles.erro}>{erro}</p>}
          <button className={styles.btn} type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
