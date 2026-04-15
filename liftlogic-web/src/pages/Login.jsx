import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLoginSuccess }) {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.senha
    })
    if (error) setErro('Email ou senha incorretos.')
    else onLoginSuccess(data.session)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha
    })
    if (error) setErro(error.message)
    else setSucesso('Conta criada! Verifique seu email para confirmar. 📧')
    setLoading(false)
  }

  return (
    <div className="login-bg">
      {/* Blobs decorativos */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo">🧱</div>
          <div className="login-logo-ring" />
        </div>

        <h1 className="login-title">DayForge</h1>
        <p className="login-subtitle">
          {modo === 'login' ? 'Forje seu dia. Um tijolo por vez.' : 'Crie sua conta e comece a construir.'}
        </p>

        <form onSubmit={modo === 'login' ? handleLogin : handleRegister} className="login-form">
          <div className="login-field">
            <label>EMAIL</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">✉️</span>
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>SENHA</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                type="password"
                name="senha"
                placeholder={modo === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={form.senha}
                onChange={handleChange}
                required
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {erro && (
            <div className="login-erro">⚠️ {erro}</div>
          )}
          {sucesso && (
            <div className="login-sucesso">✅ {sucesso}</div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-spinner" />
                Aguarde...
              </span>
            ) : modo === 'login' ? '▶ Entrar' : '🧱 Criar Conta'}
          </button>
        </form>

        <div className="login-divider"><span>ou</span></div>

        <button className="login-switch" onClick={() => {
          setModo(modo === 'login' ? 'register' : 'login')
          setErro(''); setSucesso('')
        }}>
          {modo === 'login' ? 'Não tem conta? Criar conta →' : '← Já tenho conta'}
        </button>

        <p className="login-footer">Construa hábitos. Forje resultados. 🔥</p>
      </div>
    </div>
  )
}