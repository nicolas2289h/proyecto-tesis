import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { AxiosError } from 'axios'

type RegisterForm = {
  name: string
  email: string
  password: string
  confirm: string
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validate = (data: RegisterForm) => {
    const next: Partial<RegisterForm> = {}
    if (!data.name) next.name = 'Ingresá tu nombre'
    if (!data.email) next.email = 'Ingresá tu email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'Email inválido'
    if (!data.password) next.password = 'Ingresá una contraseña'
    else if (data.password.length < 6) next.password = 'Mínimo 6 caracteres'
    if (!data.confirm) next.confirm = 'Repeti la contraseña'
    else if (data.confirm !== data.password) next.confirm = 'Las contraseñas no coinciden'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setApiError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate(form)) return
    setSubmitting(true)
    setApiError(null)
    try {
      // Mapear campos para el backend: name -> nombre
      const payload = {
        nombre: form.name,
        email: form.email,
        password: form.password
      }
      
      await api.post('/usuarios', payload)
      
      alert('Registro exitoso. Ahora podés iniciar sesión.')
      navigate('/login')
    } catch (error) {
      if (error instanceof AxiosError) {
        setApiError(error.response?.data?.message || 'Error al registrarse. Intentalo de nuevo.')
      } else {
        setApiError('Ocurrió un error inesperado')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Crear cuenta</h1>
      <p className="subtitle">Registrate para empezar a comparar precios</p>

      {apiError && (
        <div className="error-banner" style={{ 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          padding: '0.75rem', 
          borderRadius: '0.375rem', 
          marginBottom: '1rem',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            placeholder="Tu nombre"
            value={form.name}
            onChange={onChange}
            autoComplete="name"
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
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
            autoComplete="new-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="confirm">Repetir contraseña</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
          />
          {errors.confirm && <span className="error">{errors.confirm}</span>}
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <div className="switch">
        ¿Ya tenés cuenta? <Link className="link" to="/login">Iniciar sesión</Link>
      </div>
    </div>
  )
}
