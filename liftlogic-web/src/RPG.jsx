import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

const NIVEIS = [
  { nivel: 1, nome: 'Iniciante',  xpMin: 0,    xpMax: 199,  cor: '#94a3b8', emoji: '🥉' },
  { nivel: 2, nome: 'Aprendiz',   xpMin: 200,  xpMax: 499,  cor: '#10b981', emoji: '🥈' },
  { nivel: 3, nome: 'Guerreiro',  xpMin: 500,  xpMax: 999,  cor: '#6366f1', emoji: '⚔️' },
  { nivel: 4, nome: 'Campeão',    xpMin: 1000, xpMax: 1999, cor: '#f59e0b', emoji: '🏆' },
  { nivel: 5, nome: 'Lenda',      xpMin: 2000, xpMax: 9999, cor: '#ef4444', emoji: '👑' },
]

const ITENS = [
  { id: 'espada',    nome: 'Espada',     emoji: '⚔️',  nivel: 1 },
  { id: 'escudo',    nome: 'Escudo',     emoji: '🛡️',  nivel: 2 },
  { id: 'capacete',  nome: 'Capacete',   emoji: '⛑️',  nivel: 3 },
  { id: 'capa',      nome: 'Capa',       emoji: '🧣',  nivel: 3 },
  { id: 'coroa',     nome: 'Coroa',      emoji: '👑',  nivel: 4 },
  { id: 'asas',      nome: 'Asas',       emoji: '🪽',  nivel: 5 },
]

const CORES = ['#6366f1','#10b981','#ef4444','#f59e0b','#3b82f6','#a855f7','#ec4899','#f97316']

function getNivel(xp) {
  return NIVEIS.slice().reverse().find(n => xp >= n.xpMin) || NIVEIS[0]
}

function Personagem2D({ cor, itens, nivel }) {
  const temEspada = itens.includes('espada')
  const temEscudo = itens.includes('escudo')
  const temCapacete = itens.includes('capacete')
  const temCapa = itens.includes('capa')
  const temCoroa = itens.includes('coroa')
  const temAsas = itens.includes('asas')

  const corEscuro = cor + 'cc'

  return (
    <svg viewBox="0 0 300 320" width="100%" style={{ maxHeight: 320 }}>
      {/* Sombra */}
      <ellipse cx="150" cy="305" rx="55" ry="8" fill="#00000033"/>

      {/* Asas */}
      {temAsas && <>
        <path d="M95 160 Q60 140 55 180 Q60 210 95 200Z" fill="#e2e8f0" opacity="0.9"/>
        <path d="M205 160 Q240 140 245 180 Q240 210 205 200Z" fill="#e2e8f0" opacity="0.9"/>
      </>}

      {/* Capa */}
      {temCapa && (
        <path d="M110 145 L85 250 Q150 265 215 250 L190 145 Q150 158 110 145Z" fill={cor} opacity="0.85"/>
      )}

      {/* Pernas */}
      <rect x="118" y="235" width="26" height="55" rx="8" fill={corEscuro}/>
      <rect x="156" y="235" width="26" height="55" rx="8" fill={corEscuro}/>

      {/* Sapatos */}
      <rect x="113" y="283" width="33" height="13" rx="6" fill="#1e293b"/>
      <rect x="153" y="283" width="33" height="13" rx="6" fill="#1e293b"/>

      {/* Corpo */}
      <rect x="108" y="148" width="84" height="92" rx="14" fill={cor}/>

      {/* Detalhe peito */}
      <rect x="135" y="165" width="30" height="42" rx="6" fill={corEscuro}/>
      <rect x="140" y="170" width="20" height="3" rx="2" fill="#ffffff44"/>
      <rect x="140" y="177" width="20" height="3" rx="2" fill="#ffffff44"/>
      <rect x="140" y="184" width="20" height="3" rx="2" fill="#ffffff44"/>

      {/* Braço esquerdo */}
      <rect x="78" y="153" width="30" height="70" rx="10" fill={cor}/>
      <rect x="78" y="217" width="30" height="20" rx="8" fill="#fbbf24"/>

      {/* Escudo */}
      {temEscudo && (
        <path d="M60 155 Q44 155 42 170 L42 210 Q42 228 60 238 Q78 228 78 210 L78 170 Q76 155 60 155Z" fill="#1d4ed8" stroke="#3b82f6" stroke-width="1.5"/>
      )}

      {/* Braço direito */}
      <rect x="192" y="153" width="30" height="70" rx="10" fill={cor}/>
      <rect x="192" y="217" width="30" height="20" rx="8" fill="#fbbf24"/>

      {/* Espada */}
      {temEspada && <>
        <rect x="220" y="108" width="7" height="100" rx="3" fill="#c0c0c0"/>
        <rect x="212" y="195" width="23" height="7" rx="3" fill="#fbbf24"/>
        <polygon points="223.5,104 219,122 228,122" fill="#e5e7eb"/>
      </>}

      {/* Pescoço */}
      <rect x="135" y="133" width="30" height="18" rx="4" fill="#fbbf24"/>

      {/* Cabeça */}
      <rect x="110" y="72" width="80" height="68" rx="18" fill="#fbbf24"/>

      {/* Capacete */}
      {temCapacete && <>
        <path d="M108 100 Q108 65 150 62 Q192 65 192 100 L185 100 Q185 75 150 72 Q115 75 115 100Z" fill="#6b7280"/>
        <rect x="106" y="97" width="88" height="9" rx="4" fill="#4b5563"/>
      </>}

      {/* Coroa */}
      {temCoroa && (
        <path d="M115 72 L125 52 L137 68 L150 48 L163 68 L175 52 L185 72Z" fill="#ffd700" stroke="#f59e0b" stroke-width="1.5"/>
      )}

      {/* Olhos */}
      <rect x="126" y="97" width="14" height="10" rx="5" fill="#1e1b4b"/>
      <rect x="160" y="97" width="14" height="10" rx="5" fill="#1e1b4b"/>
      <circle cx="131" cy="101" r="3" fill="#fff"/>
      <circle cx="165" cy="101" r="3" fill="#fff"/>

      {/* Sorriso */}
      <path d="M136 122 Q150 130 164 122" stroke="#92400e" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>
  )
}

export default function RPG({ user, xpExterno }) {
  const [rpg, setRpg] = useState(null)
  const [log, setLog] = useState([])
  const [ranking, setRanking] = useState([])
  const [aba, setAba] = useState('personagem')
  const [corSel, setCorSel] = useState('#6366f1')
  const [itensSel, setItensSel] = useState([])
  const [carregando, setCarregando] = useState(true)

  const buscarTudo = useCallback(async () => {
    setCarregando(true)
    const { data: rpgData } = await supabase
      .from('rpg_perfil')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (rpgData) {
      setRpg(rpgData)
      setCorSel(rpgData.avatar_cor || '#6366f1')
      setItensSel(rpgData.itens_equipados || [])
    } else {
      const { data: novo } = await supabase.from('rpg_perfil').insert([{
        user_id: user.id, xp: 0, nivel: 1, avatar_cor: '#6366f1', itens_equipados: []
      }]).select().single()
      setRpg(novo)
    }

    const { data: logData } = await supabase
      .from('rpg_xp_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setLog(logData || [])

    const { data: rankData } = await supabase
      .from('rpg_perfil')
      .select('user_id, xp, nivel, avatar_cor')
      .order('xp', { ascending: false })
      .limit(10)

    const rankComPerfil = await Promise.all((rankData || []).map(async r => {
      const { data: p } = await supabase.from('perfil').select('nome').eq('user_id', r.user_id).single()
      return { ...r, nome: p?.nome || 'Anônimo' }
    }))
    setRanking(rankComPerfil)
    setCarregando(false)
  }, [user.id])

  useEffect(() => { buscarTudo() }, [buscarTudo])

  const salvarPersonagem = async () => {
    await supabase.from('rpg_perfil').update({
      avatar_cor: corSel,
      itens_equipados: itensSel,
    }).eq('user_id', user.id)
    setRpg(prev => ({ ...prev, avatar_cor: corSel, itens_equipados: itensSel }))
    alert('Personagem salvo! ✅')
  }

  const toggleItem = (itemId) => {
    setItensSel(prev =>
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    )
  }

  if (carregando) return <div style={{ textAlign: 'center', color: '#64748b', paddingTop: 40 }}>Carregando RPG... ⚔️</div>

  const xp = rpg?.xp || 0
  const nivelAtual = getNivel(xp)
  const proximoNivel = NIVEIS.find(n => n.nivel === nivelAtual.nivel + 1)
  const xpParaProximo = proximoNivel ? proximoNivel.xpMin - xp : 0
  const pctNivel = proximoNivel
    ? Math.round(((xp - nivelAtual.xpMin) / (proximoNivel.xpMin - nivelAtual.xpMin)) * 100)
    : 100

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="title-divisao" style={{ margin: 0 }}>⚔️ RPG</h2>
        <div style={{ background: nivelAtual.cor + '22', border: `1px solid ${nivelAtual.cor}44`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: nivelAtual.cor }}>
          {nivelAtual.emoji} Nível {nivelAtual.nivel} — {nivelAtual.nome}
        </div>
      </div>

      {/* XP Card */}
      <div style={{ background: '#1a1d21', border: '1px solid #ffffff0d', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>XP Total</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: nivelAtual.cor }}>{xp.toLocaleString('pt-BR')} XP</span>
        </div>
        <div style={{ height: 8, background: '#ffffff0d', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: 8, width: `${pctNivel}%`, background: nivelAtual.cor, borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        {proximoNivel && (
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Faltam {xpParaProximo} XP para {proximoNivel.emoji} {proximoNivel.nome}
          </div>
        )}
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 6, background: '#1a1d21', padding: 5, borderRadius: 12 }}>
        {[
          { id: 'personagem', label: '🧙 Personagem' },
          { id: 'ranking', label: '🏆 Ranking' },
          { id: 'log', label: '📜 Histórico XP' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            flex: 1, background: aba === a.id ? '#24282d' : 'transparent',
            border: 'none', borderRadius: 8, color: aba === a.id ? '#f8fafc' : '#64748b',
            fontSize: 11, fontWeight: 600, padding: '8px 2px', cursor: 'pointer'
          }}>{a.label}</button>
        ))}
      </div>

      {/* ABA PERSONAGEM */}
      {aba === 'personagem' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#1a1d21', border: '1px solid #ffffff0d', borderRadius: 16, overflow: 'hidden' }}>
            <Personagem2D cor={corSel} itens={itensSel} nivel={nivelAtual.nivel} />
          </div>

          <div style={{ background: '#1a1d21', border: '1px solid #ffffff0d', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 12 }}>COR DO PERSONAGEM</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CORES.map(c => (
                <button key={c} onClick={() => setCorSel(c)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, border: corSel === c ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer'
                }} />
              ))}
            </div>
          </div>

          <div style={{ background: '#1a1d21', border: '1px solid #ffffff0d', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 12 }}>ITENS DESBLOQUEADOS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ITENS.map(item => {
                const desbloqueado = nivelAtual.nivel >= item.nivel
                const equipado = itensSel.includes(item.id)
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#24282d', borderRadius: 10, padding: '10px 14px',
                    opacity: desbloqueado ? 1 : 0.4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{item.nome}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Nível {item.nivel} necessário</div>
                      </div>
                    </div>
                    {desbloqueado ? (
                      <button onClick={() => toggleItem(item.id)} style={{
                        background: equipado ? '#6366f1' : '#24282d',
                        border: `1px solid ${equipado ? '#6366f1' : '#ffffff1a'}`,
                        borderRadius: 8, color: equipado ? '#fff' : '#64748b',
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', cursor: 'pointer'
                      }}>{equipado ? 'Equipado' : 'Equipar'}</button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#475569' }}>🔒 Bloqueado</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <button onClick={salvarPersonagem} style={{
            background: '#6366f1', border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 15, fontWeight: 700, padding: 14, cursor: 'pointer'
          }}>💾 Salvar Personagem</button>
        </div>
      )}

      {/* ABA RANKING */}
      {aba === 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4 }}>TOP 10 — GLOBAL</div>
          {ranking.map((r, i) => {
            const n = getNivel(r.xp)
            const isMe = r.user_id === user.id
            return (
              <div key={r.user_id} style={{
                background: isMe ? '#6366f115' : '#1a1d21',
                border: `1px solid ${isMe ? '#6366f144' : '#ffffff0d'}`,
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#64748b', minWidth: 28 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.avatar_cor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  {n.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{r.nome} {isMe ? '(você)' : ''}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{n.nome} • {r.xp.toLocaleString('pt-BR')} XP</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA LOG */}
      {aba === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4 }}>ÚLTIMAS AÇÕES</div>
          {log.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#475569', fontSize: 13 }}>Nenhum XP ganho ainda. Bora treinar! 💪</p>
          ) : log.map(l => (
            <div key={l.id} style={{
              background: '#1a1d21', border: '1px solid #ffffff0d', borderRadius: 10,
              padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, color: '#f8fafc' }}>{l.motivo}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>+{l.xp} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}