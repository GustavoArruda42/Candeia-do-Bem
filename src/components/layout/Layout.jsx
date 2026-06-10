import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const icones = {
  dashboard: '📊',
  registro: '✍️',
  historico: '📋',
  usuarios: '👥',
};

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.marca}>
          <span className={styles.chama}>🕯️</span>
          <div>
            <span className={styles.nome}>Candeia do Bem</span>
            <span className={styles.sub}>Centro Espírita Amaral Ornellas</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({ isActive }) => `${styles.link} ${isActive ? styles.ativo : ''}`}>
            {icones.dashboard} Dashboard
          </NavLink>
          <NavLink to="/registro" className={({ isActive }) => `${styles.link} ${isActive ? styles.ativo : ''}`}>
            {icones.registro} Novo Registro
          </NavLink>
          <NavLink to="/historico" className={({ isActive }) => `${styles.link} ${isActive ? styles.ativo : ''}`}>
            {icones.historico} Histórico
          </NavLink>
          {usuario?.role === 'admin' && (
            <NavLink to="/usuarios" className={({ isActive }) => `${styles.link} ${isActive ? styles.ativo : ''}`}>
              {icones.usuarios} Usuários
            </NavLink>
          )}
        </nav>

        <div className={styles.rodape}>
          <span className={styles.userInfo}>
            <span className={styles.userBadge}>{usuario?.role === 'admin' ? '⭐' : '👤'}</span>
            {usuario?.username}
          </span>
          <button className={styles.sair} onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      <main className={styles.conteudo}>
        {children}
      </main>
    </div>
  );
}
