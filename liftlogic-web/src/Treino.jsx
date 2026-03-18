import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

function Treino({ logout, token }) {
  // Configura baseURL e Authorization para todas as requests axios
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:8080'
  }, [])

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('Token configurado no Axios')
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  const [exercicios, setExercicios] = useState([])
  const [divisao, setDivisao] = useState(localStorage.getItem('divisao') || null)
  const [treinoAtivo, setTreinoAtivo] = useState('A')
  const [concluidos, setConcluidos] = useState({})
  const [carregando, setCarregando] = useState(false)
  const [abaPrincipal, setAbaPrincipal] = useState('treino')
  const [historico, setHistorico] = useState([])

  // TIMER
  const [treinando, setTreinando] = useState(false)
  const [tempoTotal, setTempoTotal] = useState(0)
  const [descanso, setDescanso] = useState(0)
  const [inputDescanso, setInputDescanso] = useState('')

  const timerRef = useRef(null)
  const descansoRef = useRef(null)

  // SOM MAIS LONGO E FORTE (Alerta)
  const audioRef = useRef(new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.wav'))

  const [novoExercicio, setNovoExercicio] = useState({
    nome: '',
    series: '',
    repeticoes: '',
    carga: '',
    grupoMuscular: '',
    treino: 'A'
  })

  // Toca o som 3x
  const tocarAlertaLongo = () => {
    let repeticoes = 0
    const intervaloSom = setInterval(() => {
      audioRef.current.play().catch(err => console.log('Erro ao tocar áudio:', err))
      repeticoes++
      if (repeticoes >= 3) clearInterval(intervaloSom)
    }, 600)
  }

  // Cronômetro total
  useEffect(() => {
    if (treinando) {
      timerRef.current = setInterval(() => setTempoTotal(prev => prev + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [treinando])

  // Descanso regressivo + alerta
  useEffect(() => {
    if (descanso > 0) {
      descansoRef.current = setInterval(() => {
        setDescanso(prev => {
          if (prev <= 1) {
            tocarAlertaLongo()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(descansoRef.current)
    }
    return () => clearInterval(descansoRef.current)
  }, [descanso])

  // Buscar histórico (rota /api/treinos-finalizados)
  const buscarHistorico = () => {
    axios.get('/api/treinos-finalizados')
      .then(res => {
        const ordenado = res.data.sort((a, b) => {
          const dA = a.dataFinalizacao ? new Date(a.dataFinalizacao) : 0
          const dB = b.dataFinalizacao ? new Date(b.dataFinalizacao) : 0
          return dB - dA
        })
        setHistorico(ordenado)
      })
      .catch(err => {
        console.error('Erro ao buscar histórico:', err)
        // se 401/403 talvez token expirou
      })
  }

  useEffect(() => {
    if (abaPrincipal === 'historico' && token) buscarHistorico()
  }, [abaPrincipal, token])

  const formatarTempo = segundos => {
    const secs = Number(segundos || 0)
    const mins = Math.floor(secs / 60)
    const segs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
  }

  const iniciarTreino = () => {
    setTreinando(true)
    setTempoTotal(0)
    setDescanso(0)
    setInputDescanso('')
  }

  const finalizarTreino = () => {
    const exerciciosFiltrados = exercicios.filter(ex => ex.treino === treinoAtivo)
    const volumeTotalCalculado = exerciciosFiltrados.reduce(
      (acc, ex) => acc + (Number(ex.series || 0) * Number(ex.repeticoes || 0) * Number(ex.carga || 0)),
      0
    )

    const dadosTreino = {
      treino: treinoAtivo,
      tempoSegundos: tempoTotal,
      volumeTotal: volumeTotalCalculado
    }

    axios.post('/api/treinos-finalizados', dadosTreino)
      .then(res => {
        const salvo = res.data
        // atualiza histórico local imediatamente
        setHistorico(prev => [salvo, ...prev])
        alert(`Treino ${treinoAtivo} finalizado! 🔥\nTempo: ${formatarTempo(tempoTotal)}\nVolume: ${volumeTotalCalculado.toLocaleString()} kg`)
        setTreinando(false)
        setTempoTotal(0)
        setDescanso(0)
        setInputDescanso('')
        setConcluidos({})
      })
      .catch(err => {
        console.error('Erro ao salvar histórico:', err)
        if (err.response) {
          if (err.response.status === 401) alert('Não autenticado. Faça login novamente.')
          else if (err.response.status === 403) alert('Acesso negado ao salvar o treino.')
          else alert('Erro ao salvar o treino no banco de dados.')
        } else {
          alert('Erro de conexão com o servidor.')
        }
      })
  }

  const iniciarDescansoManual = () => {
    const segundos = parseInt(inputDescanso, 10)
    if (!Number.isFinite(segundos) || segundos <= 0) return
    setDescanso(segundos)
    setInputDescanso('')
  }

  const cancelarDescanso = () => setDescanso(0)

  // API Exercícios
  const buscarExercicios = () => {
    axios.get('/api/exercicios')
      .then(res => setExercicios(res.data))
      .catch(err => console.error('Erro ao buscar exercícios:', err))
  }

  useEffect(() => { buscarExercicios() }, [])

  useEffect(() => {
    if (divisao) localStorage.setItem('divisao', divisao)
  }, [divisao])

  const salvarExercicio = e => {
    e.preventDefault()
    setCarregando(true)

    const exercicioParaSalvar = {
      ...novoExercicio,
      treino: treinoAtivo,
      series: Number(novoExercicio.series),
      repeticoes: Number(novoExercicio.repeticoes),
      carga: Number(novoExercicio.carga)
    }

    axios.post('/api/exercicios', exercicioParaSalvar)
      .then(() => {
        buscarExercicios()
        setNovoExercicio({
          nome: '',
          series: '',
          repeticoes: '',
          carga: '',
          grupoMuscular: '',
          treino: treinoAtivo
        })
      })
      .catch(err => console.error('Erro ao salvar exercício:', err))
      .finally(() => setCarregando(false))
  }

  const atualizarExercicio = (id, campo, valor) => {
    const valorFinal = ['carga', 'series', 'repeticoes'].includes(campo) ? Number(valor) : valor
    axios.patch(`/api/exercicios/${id}`, { [campo]: valorFinal })
      .then(() => buscarExercicios())
      .catch(err => console.error('Erro ao atualizar exercício:', err))
  }

  const deletarExercicio = id => {
    axios.delete(`/api/exercicios/${id}`)
      .then(() => buscarExercicios())
      .catch(err => console.error('Erro ao deletar exercício:', err))
  }

  const toggleConcluido = id => setConcluidos(prev => ({ ...prev, [id]: !prev[id] }))

  // Tela de seleção
  if (!divisao) {
    return (
      <div className="container selection-screen">
        <h1>🏋️‍♂️ LiftLogic</h1>
        <p className="subtitle">Escolha sua estratégia de treino:</p>
        <div className="selection-grid">
          {['AB', 'ABC', 'ABCD', 'ABCDE'].map(op => (
            <button
              key={op}
              onClick={() => { setDivisao(op); setTreinoAtivo('A') }}
              className="select-btn"
            >
              {op}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const abasDisponiveis = divisao.split('')
  const exerciciosFiltrados = exercicios.filter(ex => ex.treino === treinoAtivo)
  const volumeTotal = exerciciosFiltrados.reduce(
    (acc, ex) => acc + (Number(ex.series || 0) * Number(ex.repeticoes || 0) * Number(ex.carga || 0)),
    0
  )

  return (
    <div className="container">
      <nav className="main-nav">
        <button className={abaPrincipal === 'treino' ? 'nav-btn active' : 'nav-btn'} onClick={() => setAbaPrincipal('treino')}>
          🏋️‍♂️ Treino
        </button>
        <button className={abaPrincipal === 'historico' ? 'nav-btn active' : 'nav-btn'} onClick={() => setAbaPrincipal('historico')}>
          📜 Histórico
        </button>

        <button className="nav-btn" onClick={logout} style={{ marginLeft: 'auto', color: '#ff6b6b' }}>
          Logout
        </button>
      </nav>

      {abaPrincipal === 'treino' && (
        <>
          <header className="header-app">
            <button className="back-btn" onClick={() => { localStorage.removeItem('divisao'); setDivisao(null) }}>
              ← Trocar Divisão
            </button>
            <div className="volume-badge">
              <span>VOLUME TOTAL</span>
              <strong>{volumeTotal.toLocaleString()} kg</strong>
            </div>
          </header>

          <div className="timer-section">
            {!treinando ? (
              <button className="btn-start-workout" onClick={iniciarTreino}>
                ▶ Iniciar Treino {treinoAtivo}
              </button>
            ) : (
              <div className="active-timer-container">
                <div className="main-timer">
                  <span>TEMPO DE TREINO</span>
                  <strong>{formatarTempo(tempoTotal)}</strong>
                </div>

                <div className={`rest-timer ${descanso > 0 ? 'active' : ''}`}>
                  <span>DESCANSO</span>
                  <strong>{formatarTempo(descanso)}</strong>

                  <div className="custom-rest-input">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      placeholder="Quanto tempo quer descansar? (seg)"
                      value={inputDescanso}
                      onChange={e => setInputDescanso(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') iniciarDescansoManual() }}
                    />
                    <div className="rest-actions">
                      <button type="button" className="btn-play-rest" onClick={iniciarDescansoManual} title="Iniciar descanso">▶</button>
                      <button type="button" className="btn-cancel-rest" onClick={cancelarDescanso} title="Cancelar descanso" disabled={descanso === 0}>✕</button>
                    </div>
                  </div>
                </div>

                <button className="btn-stop-workout" onClick={finalizarTreino}>Finalizar Treino</button>
              </div>
            )}
          </div>

          <h1 className="title-divisao">Treino {divisao}</h1>

          <div className="tabs">
            {abasDisponiveis.map(letra => (
              <button key={letra} className={treinoAtivo === letra ? 'tab-button active' : 'tab-button'} onClick={() => setTreinoAtivo(letra)}>
                {letra}
              </button>
            ))}
          </div>

          {!treinando && (
            <form className="form-cadastro" onSubmit={salvarExercicio}>
              <input type="text" placeholder="Nome do Exercício (ex: Supino Reto)" value={novoExercicio.nome} onChange={e => setNovoExercicio({ ...novoExercicio, nome: e.target.value })} required />
              <input type="text" placeholder="Grupo Muscular (ex: Peitoral)" value={novoExercicio.grupoMuscular} onChange={e => setNovoExercicio({ ...novoExercicio, grupoMuscular: e.target.value })} required />
              <div className="row">
                <input type="number" placeholder="Séries" value={novoExercicio.series} onChange={e => setNovoExercicio({ ...novoExercicio, series: e.target.value })} required />
                <input type="number" placeholder="Reps" value={novoExercicio.repeticoes} onChange={e => setNovoExercicio({ ...novoExercicio, repeticoes: e.target.value })} required />
                <input type="number" placeholder="Kg" value={novoExercicio.carga} onChange={e => setNovoExercicio({ ...novoExercicio, carga: e.target.value })} required />
              </div>
              <button type="submit" disabled={carregando}>{carregando ? '...' : `Adicionar ao Treino ${treinoAtivo}`}</button>
            </form>
          )}

          <div className="lista-exercicios">
            {exerciciosFiltrados.map(ex => (
              <div key={ex.id} className={`card ${concluidos[ex.id] ? 'concluido' : ''}`}>
                <div className="card-header">
                  <span className="tag">{ex.grupoMuscular}</span>
                  <button className="btn-delete-mini" onClick={() => deletarExercicio(ex.id)}>×</button>
                </div>
                <div className="card-main-row">
                  <button className="btn-check" onClick={() => toggleConcluido(ex.id)}>
                    {concluidos[ex.id] ? '✅' : '⭕'}
                  </button>
                  <div className="exercise-details">
                    <h3>{ex.nome}</h3>
                    <div className="edit-stats-row">
                      <input type="number" className="inline-edit" defaultValue={ex.series} onBlur={e => atualizarExercicio(ex.id, 'series', e.target.value)} />
                      <span>séries x</span>
                      <input type="number" className="inline-edit" defaultValue={ex.repeticoes} onBlur={e => atualizarExercicio(ex.id, 'repeticoes', e.target.value)} />
                      <span>reps</span>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <div className="carga-edit">
                    <span>Carga:</span>
                    <input type="number" className="inline-edit carga-input" defaultValue={ex.carga} onBlur={e => atualizarExercicio(ex.id, 'carga', e.target.value)} />
                    <strong>kg</strong>
                  </div>
                  <p className="volume-item">{Number(ex.series || 0) * Number(ex.repeticoes || 0) * Number(ex.carga || 0)}kg</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {abaPrincipal === 'historico' && (
        <div className="historico-section">
          <h1 className="title-divisao">Meu Histórico 📜</h1>
          {historico.length === 0 ? (
            <p className="empty-msg">Nenhum treino registrado ainda. Bora treinar! 💪</p>
          ) : (
            <div className="lista-historico">
              {historico.map(t => {
                const treinoNome = t.treino || '—'
                const dataFmt = t.dataFinalizacao ? new Date(t.dataFinalizacao).toLocaleDateString('pt-BR') : '-'
                const tempo = Number(t.tempoSegundos || 0)
                const volume = Number(t.volumeTotal || 0)

                return (
                  <div key={t.id} className="card-historico">
                    <div className="hist-header">
                      <span className="hist-tag">Treino {treinoNome}</span>
                      <span className="hist-date">{dataFmt}</span>
                    </div>
                    <div className="hist-stats">
                      <div className="hist-stat-item">
                        <span>TEMPO</span>
                        <strong>{formatarTempo(tempo)}</strong>
                      </div>
                      <div className="hist-stat-item">
                        <span>VOLUME</span>
                        <strong>{volume.toLocaleString()} kg</strong>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Treino