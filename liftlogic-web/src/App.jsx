import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

function App() {
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

  // SOM MAIS LONGO E FORTE (Alerta de 2 segundos)
  const audioRef = useRef(new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.wav'));

  const [novoExercicio, setNovoExercicio] = useState({
    nome: '',
    series: '',
    repeticoes: '',
    carga: '',
    grupoMuscular: '',
    treino: 'A'
  })

  // Função para tocar o alerta 3 vezes
  const tocarAlertaLongo = () => {
    let repeticoes = 0;
    const intervaloSom = setInterval(() => {
      audioRef.current.play().catch(err => console.log("Erro ao tocar áudio:", err));
      repeticoes++;
      if (repeticoes >= 3) clearInterval(intervaloSom);
    }, 600); // Toca a cada 600ms
  }

  // ===== Cronômetro total =====
  useEffect(() => {
    if (treinando) {
      timerRef.current = setInterval(() => {
        setTempoTotal(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [treinando])

  // ===== Descanso (regressivo) + Alerta Sonoro =====
  useEffect(() => {
    if (descanso > 0) {
      descansoRef.current = setInterval(() => {
        setDescanso(prev => {
          if (prev <= 1) {
            tocarAlertaLongo(); // CHAMA A FUNÇÃO DO SOM LONGO
            return 0;
          }
          return prev - 1;
        })
      }, 1000)
    } else {
      clearInterval(descansoRef.current)
    }
    return () => clearInterval(descansoRef.current)
  }, [descanso])

  // ===== Buscar Histórico =====
  const buscarHistorico = () => {
    axios.get('http://localhost:8080/api/historico')
      .then(res => {
        const ordenado = res.data.sort((a, b) => new Date(b.dataFinalizacao) - new Date(a.dataFinalizacao))
        setHistorico(ordenado)
      })
      .catch(err => console.error('Erro ao buscar histórico:', err))
  }

  useEffect(() => {
    if (abaPrincipal === 'historico') {
      buscarHistorico()
    }
  }, [abaPrincipal])

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60)
    const segs = segundos % 60
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
      (acc, ex) => acc + (Number(ex.series) * Number(ex.repeticoes) * Number(ex.carga)),
      0
    )

    const dadosTreino = {
      divisao: treinoAtivo,
      tempoSegundos: tempoTotal,
      volumeTotal: volumeTotalCalculado
    }

    axios.post('http://localhost:8080/api/historico', dadosTreino)
      .then(() => {
        alert(`Treino ${treinoAtivo} finalizado! 🔥\nTempo: ${formatarTempo(tempoTotal)}\nVolume: ${volumeTotalCalculado.toLocaleString()} kg`)
        setTreinando(false)
        setTempoTotal(0)
        setDescanso(0)
        setInputDescanso('')
        setConcluidos({})
      })
      .catch(err => {
        console.error('Erro ao salvar histórico:', err)
        alert('Erro ao salvar o treino no banco de dados.')
      })
  }

  const iniciarDescansoManual = () => {
    const segundos = parseInt(inputDescanso, 10)
    if (!Number.isFinite(segundos) || segundos <= 0) return
    setDescanso(segundos)
    setInputDescanso('')
  }

  const cancelarDescanso = () => {
    setDescanso(0)
  }

  // ===== API Exercícios =====
  const buscarExercicios = () => {
    axios.get('http://localhost:8080/api/exercicios')
      .then(res => setExercicios(res.data))
      .catch(err => console.error('Erro ao buscar:', err))
  }

  useEffect(() => {
    buscarExercicios()
  }, [])

  useEffect(() => {
    if (divisao) localStorage.setItem('divisao', divisao)
  }, [divisao])

  const salvarExercicio = (e) => {
    e.preventDefault()
    setCarregando(true)

    const exercicioParaSalvar = { ...novoExercicio, treino: treinoAtivo }

    axios.post('http://localhost:8080/api/exercicios', exercicioParaSalvar)
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
      .catch(err => console.error('Erro ao salvar:', err))
      .finally(() => setCarregando(false))
  }

  const atualizarExercicio = (id, campo, valor) => {
    axios.patch(`http://localhost:8080/api/exercicios/${id}`, { [campo]: valor })
      .then(() => buscarExercicios())
      .catch(err => console.error('Erro ao atualizar:', err))
  }

  const deletarExercicio = (id) => {
    axios.delete(`http://localhost:8080/api/exercicios/${id}`)
      .then(() => buscarExercicios())
      .catch(err => console.error('Erro ao deletar:', err))
  }

  const toggleConcluido = (id) => {
    setConcluidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ===== Tela de seleção =====
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
    (acc, ex) => acc + (Number(ex.series) * Number(ex.repeticoes) * Number(ex.carga)),
    0
  )

  return (
    <div className="container">

      <nav className="main-nav">
        <button
          className={abaPrincipal === 'treino' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setAbaPrincipal('treino')}
        >
          🏋️‍♂️ Treino
        </button>
        <button
          className={abaPrincipal === 'historico' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setAbaPrincipal('historico')}
        >
          📜 Histórico
        </button>
      </nav>

      {abaPrincipal === 'treino' && (
        <>
          <header className="header-app">
            <button
              className="back-btn"
              onClick={() => { localStorage.removeItem('divisao'); setDivisao(null) }}
            >
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
                      onChange={(e) => setInputDescanso(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') iniciarDescansoManual()
                      }}
                    />
                    <div className="rest-actions">
                      <button
                        type="button"
                        className="btn-play-rest"
                        onClick={iniciarDescansoManual}
                        title="Iniciar descanso"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        className="btn-cancel-rest"
                        onClick={cancelarDescanso}
                        title="Cancelar descanso"
                        disabled={descanso === 0}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <button className="btn-stop-workout" onClick={finalizarTreino}>
                  Finalizar Treino
                </button>
              </div>
            )}
          </div>

          <h1 className="title-divisao">Treino {divisao}</h1>

          <div className="tabs">
            {abasDisponiveis.map(letra => (
              <button
                key={letra}
                className={treinoAtivo === letra ? 'tab-button active' : 'tab-button'}
                onClick={() => setTreinoAtivo(letra)}
              >
                {letra}
              </button>
            ))}
          </div>

          {!treinando && (
            <form className="form-cadastro" onSubmit={salvarExercicio}>
              <input
                type="text"
                placeholder="Nome do Exercício (ex: Supino Reto)"
                value={novoExercicio.nome}
                onChange={e => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Grupo Muscular (ex: Peitoral)"
                value={novoExercicio.grupoMuscular}
                onChange={e => setNovoExercicio({ ...novoExercicio, grupoMuscular: e.target.value })}
                required
              />
              <div className="row">
                <input
                  type="number"
                  placeholder="Séries"
                  value={novoExercicio.series}
                  onChange={e => setNovoExercicio({ ...novoExercicio, series: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={novoExercicio.repeticoes}
                  onChange={e => setNovoExercicio({ ...novoExercicio, repeticoes: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Kg"
                  value={novoExercicio.carga}
                  onChange={e => setNovoExercicio({ ...novoExercicio, carga: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={carregando}>
                {carregando ? '...' : `Adicionar ao Treino ${treinoAtivo}`}
              </button>
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
                      <input
                        type="number"
                        className="inline-edit"
                        defaultValue={ex.series}
                        onBlur={(e) => atualizarExercicio(ex.id, 'series', e.target.value)}
                      />
                      <span>séries x</span>
                      <input
                        type="number"
                        className="inline-edit"
                        defaultValue={ex.repeticoes}
                        onBlur={(e) => atualizarExercicio(ex.id, 'repeticoes', e.target.value)}
                      />
                      <span>reps</span>
                    </div>
                  </div>
                </div>
                <div className="info">
                  <div className="carga-edit">
                    <span>Carga:</span>
                    <input
                      type="number"
                      className="inline-edit carga-input"
                      defaultValue={ex.carga}
                      onBlur={(e) => atualizarExercicio(ex.id, 'carga', e.target.value)}
                    />
                    <strong>kg</strong>
                  </div>
                  <p className="volume-item">{Number(ex.series) * Number(ex.repeticoes) * Number(ex.carga)}kg</p>
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
              {historico.map(t => (
                <div key={t.id} className="card-historico">
                  <div className="hist-header">
                    <span className="hist-tag">Treino {t.divisao}</span>
                    <span className="hist-date">
                      {new Date(t.dataFinalizacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="hist-stats">
                    <div className="hist-stat-item">
                      <span>TEMPO</span>
                      <strong>{formatarTempo(t.tempoSegundos)}</strong>
                    </div>
                    <div className="hist-stat-item">
                      <span>VOLUME</span>
                      <strong>{t.volumeTotal.toLocaleString()} kg</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default App