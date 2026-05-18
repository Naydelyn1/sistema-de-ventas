import Cookies from 'js-cookie'
import { Usuario } from './types'

export const getToken = () => Cookies.get('token')

export const getUsuario = (): Usuario | null => {
  const usuario = Cookies.get('usuario')
  if (!usuario) return null
  try {
    return JSON.parse(usuario)
  } catch {
    return null
  }
}

export const setAuth = (token: string, usuario: Usuario) => {
  Cookies.set('token', token, { expires: 1 })
  Cookies.set('usuario', JSON.stringify(usuario), { expires: 1 })
}

export const clearAuth = () => {
  Cookies.remove('token')
  Cookies.remove('usuario')
}

export const isAuthenticated = () => !!getToken()