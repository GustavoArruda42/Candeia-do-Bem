import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const trocarModo = (novoModo) => {
    setModo(novoModo);
    setErro('');
    setSucesso('');
    setSenha('');
    setConfirmarSenha('');
  };

  const handleLogin = async (e) => {
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

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setCarregando(true);
    try {
      await api.post('/auth/cadastro', { username, senha });
      setSucesso('Conta criada com sucesso! Você já pode entrar.');
      setTimeout(() => trocarModo('login'), 1800);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta');
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

        {modo === 'login' ? (
          <form className={styles.form} onSubmit={handleLogin}>
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
        ) : (
          <form className={styles.form} onSubmit={handleCadastro}>
            <div className={styles.campo}>
              <label>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="escolha um usuário"
                required
              />
            </div>
            <div className={styles.campo}>
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="mínimo 6 caracteres"
                required
              />
            </div>
            <div className={styles.campo}>
              <label>Confirmar senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="repita a senha"
                required
              />
            </div>
            {erro && <p className={styles.erro}>{erro}</p>}
            {sucesso && <p className={styles.sucesso}>{sucesso}</p>}
            <button className={styles.btn} type="submit" disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar conta de membro'}
            </button>
          </form>
        )}

        <button className={styles.alternar} onClick={() => trocarModo(modo === 'login' ? 'cadastro' : 'login')}>
          {modo === 'login' ? 'Não tem conta? Criar conta de membro' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
}