import React, { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import TreinoApp from './Treino' // importa Treino.jsx

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [modoAuth, setModoAuth] = useState('login')

  const onLoginSuccess = (tokenRecebido) => {
    setToken(tokenRecebido)
    localStorage.setItem('token', tokenRecebido)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
    setModoAuth('login')
  }

  if (!token) {
    return modoAuth === 'login' ? (
      <Login onSwitchToRegister={() => setModoAuth('register')} onLoginSuccess={onLoginSuccess} />
    ) : (
      <Register onSwitchToLogin={() => setModoAuth('login')} />
    )
  }

  return <TreinoApp logout={logout} token={token} />
}

export default App