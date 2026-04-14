import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

function formatarData(date) {
  return date.toISOString().split('T')[0]
}

export default function Suplementos({ user, compact = false }) {
  const [lista, setLista]           = useState([])
  const [checks, setChecks]         = useState({})
  const [carregando, setCarregando] = useState(true)
  const [nomeInput, setNomeInput]   = useState('')
  const [doseInput, setDoseInput]   = useState('')

  const hoje = formatarData(new Date())

  const buscarTudo = useCallback(async () => {
    setCarregando(true)
    const [{ data: suplementos }, { data: checksData }] = await Promise.all([
      supabase.from('suplementos').select('*').eq('user_id', user.id).order('ordem', { ascending: true }),
      supabase.from('suplementos_check').select('*').eq('user_id', user.id).eq('data', hoje),
    ])
    setLista(suplementos || [])
    const mapa = {}
    ;(checksData || []).forEach(c => { mapa[c.suplemento_id] = c.concluido })
    setChecks(mapa)
    setCarregando(false)
  }, [user.id])

  useEffect(() => { buscarTudo() }, [buscarTudo])

  const toggleCheck = async (suplId) => {
    const atual = checks[suplId] || false
    const novo  = !atual
    setChecks(prev => ({ ...prev, [suplId]: novo }))
    await supabase.from('suplementos_check').upsert({
      user_id: user.id, data: hoje, suplemento_id: suplId, concluido: novo
    }, { onConflict: 'user_id,data,suplemento_id' })
  }

  const adicionarSupl = async () => {
    if (!nomeInput.trim() || !doseInput.trim()) { alert('Preencha nome e dose!'); return }
    const { data, error } = await supabase.from('suplementos').insert([{
      user_id: user.id, nome: nomeInput.trim(), dose: doseInput.trim(), ordem: lista.length
    }]).select()
    if (error) { alert('Erro: ' + error.message); return }
    setLista(prev => [...prev, data[0]])
    setNomeInput(''); setDoseInput('')
  }

  const deletarSupl = async (id) => {
    if (!confirm('Remover este suplemento?')) return
    await supabase.from('suplementos').delete().eq('id', id)
    setLista(prev => prev.filter(s => s.id !== id))
    setChecks(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const concluidosHoje = lista.filter(s => checks[s.id]).length

  if (carregando) return <div style={{ textAlign: 'center', color: '#64748b', paddingTop: 20 }}>Carregando...</div>

  // MODO COMPACTO — usado na Home
  if (compact) {
    if (lista.length === 0) return null
    return (
      <div className="supl-compact">
        <div className="supl-compact-prog">
          <span>{concluidosHoje}/{lista.length} suplementos hoje</span>
        </div>
        {lista.map(s => {
          const done = !!checks[s.id]
          return (
            <div key={s.id} className={`supl-item ${done ? 'done' : ''}`} onClick={() => toggleCheck(s.id)}>
              <span className="supl-check">{done ? '✅' : '💊'}</span>
              <div className="supl-info">
                <span className="supl-nome">{s.nome}</span>
                <span className="supl-dose">{s.dose}</span>
              </div>
              <span className="supl-toggle">{done ? '✓' : '○'}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // MODO COMPLETO
  return (
    <div className="supl-section">
      <h2 className="title-divisao">💊 Suplementação</h2>

      {/* Progresso do dia */}
      {lista.length > 0 && (
        <div className="supl-prog-card">
          <div className="supl-prog-top">
            <span className="supl-prog-num">{concluidosHoje}<span>/{lista.length}</span></span>
            <span className="supl-prog-label">suplementos hoje</span>
          </div>
          <div className="supl-prog-bar-bg">
            <div className="supl-prog-bar-fill" style={{ width: `${(concluidosHoje / lista.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Lista com check */}
      {lista.length > 0 && (
        <div className="supl-card">
          <div className="supl-card-title">HOJE</div>
          {lista.map(s => {
            const done = !!checks[s.id]
            return (
              <div key={s.id} className={`supl-item-full ${done ? 'done' : ''}`}>
                <div className="supl-item-left" onClick={() => toggleCheck(s.id)}>
                  <span className="supl-check-big">{done ? '✅' : '💊'}</span>
                  <div className="supl-item-info">
                    <span className="supl-nome-full">{s.nome}</span>
                    <span className="supl-dose-full">{s.dose}</span>
                  </div>
                </div>
                <div className="supl-item-right">
                  <span className="supl-toggle-big">{done ? '✓' : '○'}</span>
                  <button className="supl-del-btn" onClick={() => deletarSupl(s.id)}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Adicionar */}
      <div className="supl-card">
        <div className="supl-card-title">ADICIONAR SUPLEMENTO</div>
        <div className="supl-add-form">
          <input
            type="text"
            placeholder="Nome (ex: Creatina)"
            value={nomeInput}
            onChange={e => setNomeInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') document.getElementById('dose-input').focus() }}
          />
          <input
            id="dose-input"
            type="text"
            placeholder="Dose (ex: 5g, 1 cápsula)"
            value={doseInput}
            onChange={e => setDoseInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') adicionarSupl() }}
          />
          <button className="supl-btn-add" onClick={adicionarSupl}>+ Adicionar</button>
        </div>
      </div>

      {lista.length === 0 && (
        <p className="empty-msg" style={{ marginTop: 8, fontSize: 13 }}>
          Nenhum suplemento cadastrado ainda. Adicione acima! 💊
        </p>
      )}
    </div>
  )
}