import { useState } from 'react'
import './App.css'

const CURSOS = [
  'Administração', 'Arquitetura e Urbanismo', 'Biomedicina',
  'Ciências Contábeis', 'Direito', 'Enfermagem', 'Engenharia Agronômica',
  'Engenharia Civil', 'Engenharia de Software', 'Engenharia Elétrica',
  'Engenharia Mecânica', 'Farmácia', 'Fisioterapia', 'Medicina Veterinária',
  'Nutrição', 'Odontologia', 'Publicidade e Propaganda', 'Psicologia',
]

export default function App() {
  const [curso, setCurso] = useState('')
  const [canal, setCanal] = useState('')
  const [email, setEmail] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [turma, setTurma] = useState('')
  const [imgSrc, setImgSrc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [webhook, setWebhook] = useState('')

  const [subEmail, setSubEmail] = useState('')
  const [subCurso, setSubCurso] = useState('')
  const [subPeriodo, setSubPeriodo] = useState('')
  const [subTurma, setSubTurma] = useState('')
  const [subLoading, setSubLoading] = useState(false)
  const [subMsg, setSubMsg] = useState(null)
  const [subErro, setSubErro] = useState(null)

  function handlePeriodo(val) {
    if (/^\d{0,2}$/.test(val)) setPeriodo(val)
  }

  function handleTurma(val) {
    if (/^[a-zA-Z]?$/.test(val)) setTurma(val.toUpperCase())
  }

  function handleSubPeriodo(val) {
    if (/^\d{0,2}$/.test(val)) setSubPeriodo(val)
  }

  function handleSubTurma(val) {
    if (/^[a-zA-Z]?$/.test(val)) setSubTurma(val.toUpperCase())
  }

  function mensagemErro(status, body) {
    if (status === 404) {
      if (body?.error?.includes('PDF')) return 'Horário deste curso não foi encontrado no site da faculdade.'
      if (body?.error?.includes('Turma')) return 'Turma não encontrada. Verifique período e turma.'
    }
    if (status === 500) return 'Erro no servidor. Tente novamente.'
    return 'Algo deu errado. Verifique os dados e tente novamente.'
  }

  async function buscar(e) {
    e.preventDefault()
    setError(null)
    setImgSrc(null)
    setLoading(true)
    const periodoPadded = periodo.padStart(2, '0')
    try {
      const params = new URLSearchParams({ curso, periodo: periodoPadded, turma, email, webhook, canal })
      const res = await fetch(`/api/ensalamento?${params}`)
      if (!res.ok) {
        let body = null
        try { body = await res.json() } catch {}
        throw new Error(mensagemErro(res.status, body))
      }
      const blob = await res.blob()
      setImgSrc(URL.createObjectURL(blob))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function inscrever(e) {
    e.preventDefault()
    setSubMsg(null)
    setSubErro(null)
    setSubLoading(true)
    const periodoPadded = subPeriodo.padStart(2, '0')
    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail, curso: subCurso, periodo: periodoPadded, turma: subTurma }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erro ao cadastrar.')
      setSubMsg('Cadastro realizado! Você receberá o ensalamento todo dia às 08h.')
      setSubEmail(''); setSubCurso(''); setSubPeriodo(''); setSubTurma('')
    } catch (err) {
      setSubErro(err.message)
    } finally {
      setSubLoading(false)
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <span className="text-xl">⭐</span>
        <h1 className="app-title" style={{ fontFamily:"medium"}}>Campo Guia</h1>
      </header>

      <form onSubmit={buscar} className="app-card">
        <div className="field">
          <label>Curso <span className="req">*</span></label>
          <select required value={curso} onChange={e => setCurso(e.target.value)}>
            <option value="">Selecione...</option>
            {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="field flex-1">
            <label>Período <span className="req">*</span></label>
            <input
              required
              type="text"
              placeholder="3"
              value={periodo}
              onChange={e => handlePeriodo(e.target.value)}
            />
          </div>
          <div className="field flex-1">
            <label>Turma <span className="req">*</span></label>
            <input
              required
              type="text"
              placeholder="A"
              value={turma}
              onChange={e => handleTurma(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Envio</label>
          <select value={canal} onChange={e => setCanal(e.target.value)}>
            <option value="">Padrão</option>
            <option value="email">Email</option>
            <option value="discord">Discord</option>
          </select>
        </div>

        {canal === 'email' && (
          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input
              required
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        )}

        {canal === 'discord' && (
          <div className="field">
            <label>Webhook <span className="req">*</span></label>
            <input
              required
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhook}
              onChange={e => setWebhook(e.target.value)}
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="app-btn">
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="spinner" />Buscando...</span>
            : 'Buscar horário'
          }
        </button>
      </form>

      {error && <p className="app-error">{error}</p>}

      {imgSrc && (
        <a href={imgSrc} target="_blank" rel="noreferrer" className="app-result-link transition-colors duration-200 border-gray-600 text-gray-600 border rounded p-4 hover:text-black hover:bg-white hover:font-bold ">
          Ver imagem →
        </a>
      )}

      <form onSubmit={inscrever} className="app-card">
        <p style={{ fontSize: '11px', color: '#555', fontFamily: "'DM Mono', monospace", margin: 0 }}>
          receber todo dia às 08h
        </p>

        <div className="field">
          <label>Email <span className="req">*</span></label>
          <input
            required
            type="email"
            placeholder="seu@email.com"
            value={subEmail}
            onChange={e => setSubEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Curso <span className="req">*</span></label>
          <select required value={subCurso} onChange={e => setSubCurso(e.target.value)}>
            <option value="">Selecione...</option>
            {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="field flex-1">
            <label>Período <span className="req">*</span></label>
            <input
              required
              type="text"
              placeholder="3"
              value={subPeriodo}
              onChange={e => handleSubPeriodo(e.target.value)}
            />
          </div>
          <div className="field flex-1">
            <label>Turma <span className="req">*</span></label>
            <input
              required
              type="text"
              placeholder="A"
              value={subTurma}
              onChange={e => handleSubTurma(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={subLoading} className="app-btn">
          {subLoading
            ? <span className="flex items-center justify-center gap-2"><span className="spinner" />Cadastrando...</span>
            : 'Cadastrar'
          }
        </button>

        {subMsg && <p className="app-error" style={{ color: '#4a4' }}>{subMsg}</p>}
        {subErro && <p className="app-error">{subErro}</p>}
      </form>

      <footer className="app-footer">
        desenvolvido por{' '}
        <a href="https://github.com/whoisleoo" target="_blank" rel="noreferrer">whoisleoo</a>
      </footer>
    </div>
  )
}
