import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [exercicios, setExercicios] = useState([])
  const [novoExercicio, setNovoExercicio] = useState({
    nome: '',
    series: '',
    repeticoes: '',
    carga: '',
    grupoMuscular: ''
  })

  const buscarExercicios = () => {
    axios.get('http://localhost:8080/api/exercicios')
      .then(res => setExercicios(res.data))
      .catch(err => console.error("Erro ao buscar:", err))
  }

  useEffect(() => {
    buscarExercicios()
  }, [])

  const salvarExercicio = (e) => {
    e.preventDefault()
    axios.post('http://localhost:8080/api/exercicios', novoExercicio)
      .then(() => {
        buscarExercicios()
        setNovoExercicio({ nome: '', series: '', repeticoes: '', carga: '', grupoMuscular: '' })
      })
      .catch(err => console.error("Erro ao salvar:", err))
  }

  const deletarExercicio = (id) => {
    axios.delete(`http://localhost:8080/api/exercicios/${id}`)
      .then(() => buscarExercicios())
      .catch(err => console.error("Erro ao deletar:", err))
  }

  return (
    <div className="container">
      <h1>🏋️‍♂️ LiftLogic - Workout Tracker</h1>

      <form className="form-cadastro" onSubmit={salvarExercicio}>
        <input type="text" placeholder="Nome do Exercício" value={novoExercicio.nome} onChange={e => setNovoExercicio({...novoExercicio, nome: e.target.value})} required />
        <input type="text" placeholder="Grupo Muscular" value={novoExercicio.grupoMuscular} onChange={e => setNovoExercicio({...novoExercicio, grupoMuscular: e.target.value})} required />
        <div className="row">
          <input type="number" placeholder="Séries" value={novoExercicio.series} onChange={e => setNovoExercicio({...novoExercicio, series: e.target.value})} required />
          <input type="number" placeholder="Reps" value={novoExercicio.repeticoes} onChange={e => setNovoExercicio({...novoExercicio, repeticoes: e.target.value})} required />
          <input type="number" placeholder="Carga (kg)" value={novoExercicio.carga} onChange={e => setNovoExercicio({...novoExercicio, carga: e.target.value})} required />
        </div>
        <button type="submit">Adicionar Exercício</button>
      </form>

      <div className="lista-exercicios">
        {exercicios.map(ex => (
          <div key={ex.id} className="card">
            <button className="btn-delete" onClick={() => deletarExercicio(ex.id)}>X</button>
            <h3>{ex.nome}</h3>
            <span className="tag">{ex.grupoMuscular}</span>
            <div className="info">
              <p>Carga: <strong>{ex.carga} kg</strong></p>
              <p>{ex.series} x {ex.repeticoes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App