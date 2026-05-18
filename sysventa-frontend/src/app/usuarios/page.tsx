'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Usuario } from '@/lib/types'
import { ToggleLeft, ToggleRight, Plus, X, Eye, EyeOff, Pencil } from 'lucide-react'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import Pagination from '@/components/Pagination'

const rolColor: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  CAJERO: 'bg-blue-100 text-blue-700',
  ALMACENERO: 'bg-gray-100 text-gray-700',
}

interface UsuarioForm {
  nombre: string
  email: string
  password: string
  rol: 'ADMIN' | 'CAJERO' | 'ALMACENERO'
}

const initialForm: UsuarioForm = { nombre: '', email: '', password: '', rol: 'CAJERO' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<UsuarioForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [page, setPage] = useState(1)
  const { toast, showToast, closeToast } = useToast()

  const load = async () => {
    try {
      const res = await api.get<Usuario[]>('/usuarios')
      setUsuarios(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id: number, activo: boolean) => {
    try {
      await api.patch(`/usuarios/${id}/toggle`)
      load()
      showToast(activo ? 'Usuario desactivado' : 'Usuario activado')
    } catch {
      showToast('Error al cambiar el estado del usuario', 'error')
    }
  }

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(initialForm); setError(''); setShowPass(false) }

  const openEdit = (u: Usuario) => {
    setEditId(u.id)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol as UsuarioForm['rol'] })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editId) {
        const body: Partial<UsuarioForm> = { nombre: form.nombre, email: form.email, rol: form.rol }
        if (form.password) body.password = form.password
        await api.patch(`/usuarios/${editId}`, body)
        showToast('Usuario actualizado correctamente')
      } else {
        await api.post('/usuarios', form)
        showToast('Usuario creado correctamente')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      const fallback = editId ? 'Error al actualizar el usuario' : 'Error al crear el usuario'
      setError(msg ?? fallback)
      showToast(msg ?? fallback, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Usuarios del Sistema</h2>
          <button
            onClick={() => { setEditId(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Nombre', 'Email', 'Rol', 'Estado', 'Registrado', 'Acciones'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    usuarios.slice((page - 1) * 10, page * 10).map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{u.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${rolColor[u.rol] ?? 'bg-gray-100 text-gray-600'}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs">
                          {new Date(u.creadoEn).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEdit(u)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggle(u.id, u.activo)} title={u.activo ? 'Desactivar' : 'Activar'}>
                              {u.activo
                                ? <ToggleRight className="w-6 h-6 text-green-500" />
                                : <ToggleLeft className="w-6 h-6 text-gray-400" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && usuarios.length > 0 && (
            <Pagination total={usuarios.length} page={page} pageSize={10} onChange={setPage} />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Maria Lopez"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@sysventa.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editId ? 'Nueva contrasena (dejar vacío para no cambiar)' : 'Contrasena *'}
                </label>
                <div className="relative">
                  <input
                    required={!editId}
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editId ? 'Dejar vacío para mantener la actual' : 'Minimo 6 caracteres'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as UsuarioForm['rol'] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CAJERO">CAJERO</option>
                  <option value="ALMACENERO">ALMACENERO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  CAJERO: ventas · ALMACENERO: productos · ADMIN: acceso total
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
