import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  // Tenta ler o token guardado no navegador. Se não existir, fica null.
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLogin, setIsLogin] = useState(true); // true = Tela de Login, false = Tela de Cadastro
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroAuth, setErroAuth] = useState('');

  // --- ESTADOS DAS TAREFAS ---
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  // URL base do seu backend no Render
  const API_URL = 'https://site-tarefas-hysc.onrender.com';

  // --- FUNÇÕES DE AUTENTICAÇÃO ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setErroAuth('');
    const endpoint = isLogin ? '/auth/login' : '/auth/cadastro';
    
    try {
      const resposta = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await resposta.json();

      if (!resposta.ok) {
        setErroAuth(data.erro || 'Erro ao autenticar');
        return;
      }

      if (isLogin) {
        // Login com sucesso! Guarda o token no navegador
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setEmail('');
        setSenha('');
      } else {
        // Cadastro com sucesso!
        alert('Cadastro efetuado com sucesso! Agora faça login com muito amor 💖');
        setIsLogin(true); // Volta para a tela de login
      }
    } catch (erro) {
      setErroAuth('Erro de conexão com o servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Deleta o token do navegador
    setToken(null);
    setTarefas([]); // Limpa as tarefas do ecrã por segurança
  };

  // --- FUNÇÕES DE TAREFAS (COM SEGURANÇA) ---
  
  // Função auxiliar para injetar o Token JWT em todas as requisições de tarefas
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  });

  const carregarTarefas = async () => {
    if (!token) return; // Se não tem login, nem tenta buscar
    try {
      const resposta = await fetch(`${API_URL}/tarefas`, { headers: getHeaders() });
      if (resposta.status === 401 || resposta.status === 403) {
        handleLogout(); // Se o token estiver expirado ou inválido, desloga o usuário
        return;
      }
      const data = await resposta.json();
      setTarefas(data || []); 
    } catch (erro) {
      console.error('Erro ao buscar tarefas:', erro);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, [token]); // Executa sempre que o token mudar (quando o usuário fizer login)

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/tarefas`, {
        method: 'POST',
        headers: getHeaders(), // 🔒 Envia o token aqui
        body: JSON.stringify({ titulo, descricao })
      });
      setTitulo('');
      setDescricao('');
      carregarTarefas(); // Recarrega a lista atualizada
    } catch (erro) {
      console.error('Erro ao criar tarefa:', erro);
    }
  };

  const alternarConclusao = async (tarefa) => {
    try {
      await fetch(`${API_URL}/tarefas/${tarefa.id}`, {
        method: 'PATCH',
        headers: getHeaders(), // 🔒 Envia o token aqui
        body: JSON.stringify({ concluida: !tarefa.concluida }) // Inverte o status atual
      });
      carregarTarefas(); // Recarrega a lista atualizada
    } catch (erro) {
      console.error('Erro ao atualizar tarefa:', erro);
    }
  };

  const deletarTarefa = async (id) => {
    try {
      await fetch(`${API_URL}/tarefas/${id}`, {
        method: 'DELETE',
        headers: getHeaders() // 🔒 Envia o token aqui
      });
      carregarTarefas(); // Recarrega a lista atualizada
    } catch (erro) {
      console.error('Erro ao deletar tarefa:', erro);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO DAS TELAS
  // ==========================================
  
  // 1. TELA DE LOGIN / CADASTRO (Se NÃO houver Token)
  if (!token) {
    return (
      <div className="container">
         <span className="decoracao d1">⭐</span>
         <span className="decoracao d2">💖</span>
         
         <h1>{isLogin ? 'Bem-vindo de volta! 💕' : 'Crie sua conta! 🌸'}</h1>
         
         {erroAuth && <p className="erro-msg">{erroAuth}</p>}
         
         <form onSubmit={handleAuth}>
           <input 
             type="email" 
             placeholder="Seu e-mail fofinho..." 
             value={email} 
             onChange={(e) => setEmail(e.target.value)} 
             required 
           />
           <input 
             type="password" 
             placeholder="Sua senha secreta..." 
             value={senha} 
             onChange={(e) => setSenha(e.target.value)} 
             required 
           />
           <button type="submit" className="btn-adicionar">
             {isLogin ? 'Entrar ✨' : 'Cadastrar 🎀'}
           </button>
         </form>

         <p className="auth-toggle">
           {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
           <button type="button" className="btn-auth-toggle" onClick={() => setIsLogin(!isLogin)}>
             {isLogin ? ' Cadastre-se aqui!' : ' Entre aqui!'}
           </button>
         </p>
      </div>
    );
  }

  // 2. TELA DE TAREFAS (Se HOUVER Token)
  return (
    <div className="container">
      <span className="decoracao d1">⭐</span>
      <span className="decoracao d2">💖</span>
      
      <div className="header-tarefas">
        <h1>Meus Planos</h1>
        <button className="btn-sair" onClick={handleLogout} title="Sair da conta">Sair 🚪</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="O que vamos fazer hoje? 🌸" 
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="Detalhes fofinhos..." 
          value={descricao} 
          onChange={(e) => setDescricao(e.target.value)} 
          required 
        />
        <button type="submit" className="btn-adicionar">Adicionar 💕</button>
      </form>

      <ul>
        {tarefas.map(tarefa => (
          <li key={tarefa.id} className={`tarefa-item ${tarefa.concluida ? 'concluida' : ''}`}>
            
            {/* Clicar no coraçãozinho vai disparar o PATCH para concluir/desconcluir */}
            <div className="icone-status" onClick={() => alternarConclusao(tarefa)} style={{ cursor: 'pointer' }}>
              {tarefa.concluida ? '💖' : '🤍'}
            </div>

            <div className="tarefa-info">
              <strong>{tarefa.titulo}</strong>
              <p>{tarefa.descricao}</p>
            </div>

            {/* Clicar no X vai disparar o DELETE */}
            <button 
              className="btn-excluir" 
              onClick={() => deletarTarefa(tarefa.id)}
              title="Excluir tarefa"
            >
              ✖️
            </button>
            
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
