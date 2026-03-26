import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { AxiosError } from 'axios'

type LoginForm = {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

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
    setApiError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate(form)) return
    setSubmitting(true)
    setApiError(null)
    try {
      const response = await api.post('/auth/login', form)
      const { data } = response.data
      
      // El backend devuelve LoginResponseDto: { token, email, roles }
      // El store espera User: { id, email, nombre }
      // Como el login no devuelve el id y nombre completos, podemos guardar lo que tenemos
      setAuth(
        { id: 0, email: data.email, nombre: data.email.split('@')[0] }, 
        data.token
      )
      
      navigate('/home')
    } catch (error) {
      if (error instanceof AxiosError) {
        setApiError(error.response?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.')
      } else {
        setApiError('Ocurrió un error inesperado')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Iniciar sesión</h1>
      <p className="subtitle">Accedé para comparar precios y gestionar tus listas</p>
      
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
