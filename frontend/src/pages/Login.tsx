import { useState } from 'react'
import { Link } from 'react-router-dom'

type LoginForm = {
  email: string
  password: string
}

export default function Login() {
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (data: LoginForm) => {
    const next: Partial<LoginForm> = {}
    if (!data.email) next.email = 'Ingresá tu email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'Email inválido'
    if (!data.password) next.password = 'Ingresá tu contraseña'
    else if (data.password.length < 6) next.password = 'Mínimo 6 caracteres'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate(form)) return
    setSubmitting(true)
    try {
      // TODO: integrar con backend (POST /api/auth/login)
      await new Promise((r) => setTimeout(r, 600))
      alert('Login exitoso (demo)')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Iniciar sesión</h1>
      <p className="subtitle">Accedé para comparar precios y gestionar tus listas</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="usuario@correo.com"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="switch">
        ¿No tenés cuenta? <Link className="link" to="/registro">Registrate</Link>
      </div>
    </div>
  )
}
