import { useState } from 'react'
// ESSE FRONTEND FOI VIBECODADO TOTALMENTE VIBECODADO

  const CURSOS = [
  'Administração',
  'Arquitetura e Urbanismo',
  'Biomedicina',
  'Ciências Contábeis',
  'Direito',
  'Enfermagem',
  'Engenharia Agronômica',
  'Engenharia Civil',
  'Engenharia de Software',
  'Engenharia Elétrica',
  'Engenharia Mecânica',
  'Farmácia',
  'Fisioterapia',
  'Medicina Veterinária',
  'Nutrição',
  'Odontologia',
  'Publicidade e Propaganda',
  'Psicologia',
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



  function handlePeriodo(val) {
    if (/^\d{0,2}$/.test(val)) setPeriodo(val)
  }

  function handleTurma(val) {
    if (/^[a-zA-Z]?$/.test(val)) setTurma(val.toUpperCase())
  }

  function mensagemErro(status, body) {
    if (status === 404) {
      if (body?.error?.includes('PDF')) return 'Horário deste curso não foi encontrado no site da faculdade.'
      if (body?.error?.includes('Turma')) return 'Turma não encontrada. Verifique se o período e a turma estão corretos.'
    }
    if (status === 500) return 'Erro no servidor. Tente novamente em alguns instantes.'
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-2xl font-bold text-indigo-600 mb-8" style={{ fontFamily: 'medium' }}>⭐ Campo Guia </h1>

      <form onSubmit={buscar} className="bg-white shadow rounded-lg p-6 w-full max-w-md flex flex-col gap-4">

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">* Curso</label>
          <select
            required
            value={curso}
            onChange={e => setCurso(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Selecione...</option>
            {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">* Período</label>
          <input
            required
            type="text"
            placeholder="Ex: 3"
            value={periodo}
            onChange={e => handlePeriodo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">* Turma</label>
          <input
            required
            type="text"
            placeholder="Ex: A"
            value={turma}
            onChange={e => handleTurma(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Modo de envio</label>
          <select
            value={canal}
            onChange={e => setCanal(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Padrão</option>
            <option value="email">Email</option>
            <option value="discord">Discord</option>  
          </select>
        </div>

        {canal === "email" && (
        <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Envio por email
        </label>
        <input
        required
        type="email"
        placeholder="Ex: aaa@gmail.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
         </div>
)}
        

        {canal === "discord" && (
        <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Envio por Discord Webhook
        </label>
        <input
        required
        type="text"
        placeholder="Ex: https://discord.com/api/webhooks/"
        value={webhook}
        onChange={e => setWebhook(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
         </div>
)}

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded py-2 text-sm transition-colors"
        >
          {loading ? 'Buscando...' : 'Buscar Horário'}
        </button>
      </form>

      <div className='mt-5 mb-5  text-center'>
        <h1 className='text-indigo-900'>developed by </h1> <a href="https://github.com/whoisleoo" className='hover:text-indigo-700 transition-colors'>whoisleoo</a>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm max-w-md w-full">
          {error}
        </div>
      )}

      {imgSrc && (
        <a
          href={imgSrc}
          target="_blank"
          rel="noreferrer"
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded py-2 px-6 text-sm transition-colors"
        >
          Ver imagem
        </a>
      )}
    </div>
  )
}
