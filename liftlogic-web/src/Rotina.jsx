import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

const PERIODOS = ['Acordar', 'Manhã', 'Tarde', 'Noite']

function formatarData(date) {
  return date.toISOString().split('T')[0]
}

function labelData(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.round((d - hoje) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export default function Rotina({ user }) {
  const [dias, setDias]               = useState([])
  const [tarefas, setTarefas]         = useState({})
  const [carregando, setCarregando]   = useState(true)
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [gerando, setGerando]         = useState(false)
  const [novasTarefas, setNovasTarefas] = useState({})
  const [editando, setEditando]       = useState(null)
  const [modalClone, setModalClone]   = useState(null)
    const [clonando, setClonando]       = useState(false)

  const hoje = formatarData(new Date())

  const buscarRotina = useCallback(async () => {
    setCarregando(true)
    const { data: diasData } = await supabase
      .from('rotina_dias').select('*').eq('user_id', user.id).order('data', { ascending: true })

    if (!diasData || diasData.length === 0) {
      setDias([]); setTarefas({}); setCarregando(false); return
    }

    setDias(diasData)
    const ids = diasData.map(d => d.id)
    const { data: tarefasData } = await supabase
      .from('rotina_tarefas').select('*').in('dia_id', ids).order('ordem', { ascending: true })

    const agrupado = {}
    diasData.forEach(d => { agrupado[d.id] = {} })
    ;(tarefasData || []).forEach(t => {
      if (!agrupado[t.dia_id]) agrupado[t.dia_id] = {}
      if (!agrupado[t.dia_id][t.periodo]) agrupado[t.dia_id][t.periodo] = []
      agrupado[t.dia_id][t.periodo].push(t)
    })

    setTarefas(agrupado)
    setCarregando(false)
  }, [user.id])

  useEffect(() => { buscarRotina() }, [buscarRotina])

  const gerarDias = async () => {
    if (!startDate || !endDate) { alert('Selecione as duas datas!'); return }
    if (startDate > endDate) { alert('Data inicial não pode ser maior que a final!'); return }

    if (dias.length > 0) {
      if (!confirm('Você já tem uma rotina! Deseja apagar tudo e criar uma nova?')) return
      const ids = dias.map(d => d.id)
      await supabase.from('rotina_tarefas').delete().in('dia_id', ids)
      await supabase.from('rotina_dias').delete().eq('user_id', user.id)
    }

    setGerando(true)
    const datas = []
    let cur = new Date(startDate + 'T00:00:00')
    const fim = new Date(endDate + 'T00:00:00')
    while (cur <= fim) { datas.push(formatarData(cur)); cur.setDate(cur.getDate() + 1) }

    const { error } = await supabase.from('rotina_dias').insert(datas.map(data => ({ user_id: user.id, data })))
    if (error) { alert('Erro ao gerar rotina: ' + error.message); setGerando(false); return }
    setGerando(false)
    buscarRotina()
  }

  const adicionarTarefa = async (diaId, periodo) => {
    const key = `${diaId}_${periodo}`
    const texto = (novasTarefas[key] || '').trim()
    if (!texto) return
    const tarefasDoPeriodo = tarefas[diaId]?.[periodo] || []
    const { data, error } = await supabase.from('rotina_tarefas').insert([{
      user_id: user.id, dia_id: diaId, periodo, texto, concluida: false, ordem: tarefasDoPeriodo.length
    }]).select()
    if (error) { alert('Erro: ' + error.message); return }
    setTarefas(prev => ({
      ...prev,
      [diaId]: { ...prev[diaId], [periodo]: [...(prev[diaId]?.[periodo] || []), data[0]] }
    }))
    setNovasTarefas(prev => ({ ...prev, [key]: '' }))
  }

  const toggleTarefa = async (diaId, periodo, tarefa) => {
    const nova = !tarefa.concluida
    await supabase.from('rotina_tarefas').update({ concluida: nova }).eq('id', tarefa.id)
    setTarefas(prev => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [periodo]: prev[diaId][periodo].map(t => t.id === tarefa.id ? { ...t, concluida: nova } : t)
      }
    }))
  }

  const deletarTarefa = async (diaId, periodo, tarefaId) => {
    const { error } = await supabase.from('rotina_tarefas').delete().eq('id', tarefaId)
    if (error) { alert('Erro ao deletar: ' + error.message); return }
    setTarefas(prev => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [periodo]: (prev[diaId]?.[periodo] || []).filter(t => t.id !== tarefaId)
      }
    }))
  }

  const salvarEdicao = async (diaId, periodo, tarefa, novoTexto) => {
    if (!novoTexto.trim()) { deletarTarefa(diaId, periodo, tarefa.id); setEditando(null); return }
    await supabase.from('rotina_tarefas').update({ texto: novoTexto.trim() }).eq('id', tarefa.id)
    setTarefas(prev => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        [periodo]: prev[diaId][periodo].map(t => t.id === tarefa.id ? { ...t, texto: novoTexto.trim() } : t)
      }
    }))
    setEditando(null)
  }

  const resetarRotina = async () => {
    if (!confirm('Apagar toda a rotina? Isso não pode ser desfeito.')) return
    const ids = dias.map(d => d.id)
    await supabase.from('rotina_tarefas').delete().in('dia_id', ids)
    await supabase.from('rotina_dias').delete().eq('user_id', user.id)
    setDias([]); setTarefas({})
  }

  const confirmarClone = async (diaDestinoId) => {
      if (clonando) return
      setClonando(true)
      const diaOrigemId = modalClone
      setModalClone(null)
    const tarefasOrigem = PERIODOS.flatMap(p =>
      (tarefas[diaOrigemId]?.[p] || []).map(t => ({ ...t, periodo: p }))
    )
    if (tarefasOrigem.length === 0) { alert('Nenhuma tarefa para clonar!'); setModalClone(null); setClonando(false); return }

    const novas = tarefasOrigem.map(t => ({
      user_id: user.id,
      dia_id: diaDestinoId,
      periodo: t.periodo,
      texto: t.texto,
      concluida: false,
      ordem: (tarefas[diaDestinoId]?.[t.periodo]?.length || 0)
    }))

    const { data, error } = await supabase.from('rotina_tarefas').insert(novas).select()
    if (error) { alert('Erro: ' + error.message); setClonando(false); return }

    setTarefas(prev => {
      const novo = { ...prev }
      data.forEach(t => {
        if (!novo[t.dia_id]) novo[t.dia_id] = {}
        if (!novo[t.dia_id][t.periodo]) novo[t.dia_id][t.periodo] = []
        novo[t.dia_id][t.periodo].push(t)
      })
      return novo
    })

    setClonando(false)
    setModalClone(null)
    alert(`✅ ${data.length} tarefa(s) clonada(s)!`)
  }

  if (carregando) return <div style={{ textAlign: 'center', color: '#64748b', paddingTop: 40 }}>Carregando...</div>

  return (
    <div className="rotina-section">

      {/* Modal clone */}
      {modalClone && (
        <div className="modal-overlay" onClick={() => setModalClone(null)}>
          <div className="modal-resumo" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1rem', marginBottom: 16 }}>⧉ Clonar tarefas para...</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dias.filter(d => d.id !== modalClone).map(d => (
                <button
                  key={d.id}
                  onClick={(e) => { e.stopPropagation(); if (!clonando) confirmarClone(d.id) }}
                  style={{
                    background: '#24282d', border: '1px solid #ffffff0d', color: '#f8fafc',
                    borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                    textAlign: 'left', fontSize: 14, transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.target.style.borderColor = '#6366f144'}
                  onMouseLeave={e => e.target.style.borderColor = '#ffffff0d'}
                >
                  <span style={{ color: '#6366f1', fontWeight: 700, marginRight: 8 }}>{labelData(d.data)}</span>
                  {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                </button>
              ))}
            </div>
            <button
              onClick={() => setModalClone(null)}
              style={{ marginTop: 14, background: 'transparent', border: '1px solid #ffffff0d', color: '#64748b', borderRadius: 8, padding: '10px', cursor: 'pointer', width: '100%' }}
            >Cancelar</button>
          </div>
        </div>
      )}

      {/* Config de datas */}
      <div className="rotina-config">
        <div className="rotina-config-row">
          <div className="rotina-config-field">
            <label>Data inicial</label>
            <input type="date" value={startDate} min={hoje} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="rotina-config-field">
            <label>Data final</label>
            <input type="date" value={endDate} min={startDate || hoje} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="rotina-config-btns">
          <button className="rotina-btn-gerar" onClick={gerarDias} disabled={gerando}>
            {gerando ? 'Gerando...' : '+ Gerar Rotina'}
          </button>
          {dias.length > 0 && (
            <button className="rotina-btn-reset" onClick={resetarRotina}>Resetar</button>
          )}
        </div>
      </div>

      {dias.length === 0 ? (
        <p className="empty-msg" style={{ marginTop: 40 }}>Nenhuma rotina gerada ainda. Selecione as datas acima! 📋</p>
      ) : (
        dias.map(dia => {
          const isHoje = dia.data === hoje
          const totalTarefas = PERIODOS.flatMap(p => tarefas[dia.id]?.[p] || []).length
          const concluidas = PERIODOS.flatMap(p => tarefas[dia.id]?.[p] || []).filter(t => t.concluida).length

          return (
            <div key={dia.id} className={`rotina-dia ${isHoje ? 'hoje' : ''}`}>
              <div className="rotina-dia-header">
                <div>
                  <div className="rotina-dia-label">{labelData(dia.data)}</div>
                  <div className="rotina-dia-data">
                    {new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {totalTarefas > 0 && (
                    <div className="rotina-dia-prog">
                      <span>{concluidas}/{totalTarefas}</span>
                      <div className="rotina-dia-prog-bar">
                        <div style={{ width: `${(concluidas / totalTarefas) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <button className="rotina-btn-clonar" onClick={() => setModalClone(dia.id)}>⧉</button>
                </div>
              </div>

              {PERIODOS.map(periodo => {
                const key = `${dia.id}_${periodo}`
                const itens = tarefas[dia.id]?.[periodo] || []
                return (
                  <div key={periodo} className="rotina-periodo">
                    <div className="rotina-periodo-title">{periodo}</div>
                    {itens.map(t => (
                      <div key={t.id} className={`rotina-tarefa ${t.concluida ? 'concluida' : ''}`}>
                        <button className="rotina-check" onClick={() => toggleTarefa(dia.id, periodo, t)}>
                          {t.concluida ? '✅' : '⭕'}
                        </button>
                        {editando === t.id ? (
                          <input
                            className="rotina-edit-input"
                            defaultValue={t.texto}
                            autoFocus
                            onBlur={e => salvarEdicao(dia.id, periodo, t, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') salvarEdicao(dia.id, periodo, t, e.target.value)
                              if (e.key === 'Escape') setEditando(null)
                            }}
                          />
                        ) : (
                          <span className="rotina-tarefa-texto" onDoubleClick={() => setEditando(t.id)}>
                            {t.texto}
                          </span>
                        )}
                        <button className="rotina-del" onClick={() => deletarTarefa(dia.id, periodo, t.id)}>×</button>
                      </div>
                    ))}
                    <div className="rotina-add-row">
                      <input
                        type="text"
                        className="rotina-add-input"
                        placeholder="+ Nova tarefa"
                        value={novasTarefas[key] || ''}
                        onChange={e => setNovasTarefas(prev => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') adicionarTarefa(dia.id, periodo) }}
                      />
                      <button className="rotina-add-btn" onClick={() => adicionarTarefa(dia.id, periodo)}>+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}