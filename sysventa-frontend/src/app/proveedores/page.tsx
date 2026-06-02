'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Proveedor } from '@/lib/types'
import { Plus, ToggleLeft, ToggleRight, X, Pencil, Loader2, Search, Truck, Mail, UserCheck } from 'lucide-react'
import Pagination from '@/components/Pagination'
import { getUsuario } from '@/lib/auth'

interface ProveedorForm {
  nombre: string
  ruc: string
  contacto: string
  telefono: string
  email: string
}

const initialForm: ProveedorForm = { nombre: '', ruc: '', contacto: '', telefono: '', email: '' }

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ProveedorForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [rucLoading, setRucLoading] = useState(false)
  const [rucError, setRucError] = useState('')
  const [filtro, setFiltro] = useState<'activos' | 'inactivos' | 'todos'>('activos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const { toast, showToast, closeToast } = useToast()
  const router = useRouter()
  const usuario = getUsuario()
  const rol = usuario?.rol

  useEffect(() => {
    if (rol && rol !== 'ADMIN' && rol !== 'ALMACENERO') {
      router.replace('/dashboard')
    }
  }, [rol, router])

  const load = async () => {
    try {
      const res = await api.get<Proveedor[]>('/proveedores?todos=true')
      setProveedores(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (form.ruc.length === 11 && showModal) {
      buscarRuc(form.ruc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ruc])

  const buscarRuc = async (ruc: string) => {
    setRucLoading(true)
    setRucError('')
    try {
      const res = await api.get<{ razonSocial: string }>(`/facturacion/ruc/${ruc}`)
      setForm((prev) => ({ ...prev, nombre: res.data.razonSocial }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'RUC no encontrado en SUNAT'
      setRucError(msg)
    } finally {
      setRucLoading(false)
    }
  }

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (filtro === 'activos' && !p.activo) return false
    if (filtro === 'inactivos' && p.activo) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.ruc ?? '').includes(q) ||
        (p.contacto ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })
  const proveedoresPag = proveedoresFiltrados.slice((page - 1) * 10, page * 10)

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(initialForm); setRucError('') }

  const openEdit = (p: Proveedor) => {
    setEditId(p.id)
    setForm({
      nombre: p.nombre,
      ruc: p.ruc ?? '',
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      email: p.email ?? '',
    })
    setShowModal(true)
  }

  const buildBody = () => ({
    nombre: form.nombre,
    ...(form.ruc && { ruc: form.ruc }),
    ...(form.contacto && { contacto: form.contacto }),
    ...(form.telefono && { telefono: form.telefono }),
    ...(form.email && { email: form.email }),
  })

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.patch(`/proveedores/${editId}`, buildBody())
        showToast('Proveedor actualizado correctamente')
      } else {
        await api.post('/proveedores', buildBody())
        showToast('Proveedor registrado correctamente')
      }
      closeModal()
      load()
    } catch {
      showToast('Error al guardar el proveedor', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (p: Proveedor) => {
    try {
      await api.patch(`/proveedores/${p.id}/toggle`)
      load()
      showToast(p.activo ? 'Proveedor desactivado' : 'Proveedor activado')
    } catch {
      showToast('Error al cambiar el estado del proveedor', 'error')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-700 mr-auto">Proveedores</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre, RUC o contacto..."
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(''); setPage(1) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['activos', 'inactivos', 'todos'] as const).map((op) => (
              <button
                key={op}
                onClick={() => { setFiltro(op); setPage(1) }}
                className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                  filtro === op
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {op === 'activos' ? `Activos (${proveedores.filter(p => p.activo).length})`
                  : op === 'inactivos' ? `Inactivos (${proveedores.filter(p => !p.activo).length})`
                  : 'Todos'}
              </button>
            ))}
          </div>
          {(rol === 'ADMIN' || rol === 'ALMACENERO') && (
            <button
              onClick={() => { setEditId(null); setShowModal(true) }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          )}
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Activos</p>
              <p className="text-2xl font-bold text-gray-800">{proveedores.filter(p => p.activo).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Con contacto</p>
              <p className="text-2xl font-bold text-gray-800">{proveedores.filter(p => p.activo && p.contacto).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Con email</p>
              <p className="text-2xl font-bold text-gray-800">{proveedores.filter(p => p.activo && p.email).length}</p>
            </div>
          </div>
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
                    {['Nombre', 'RUC', 'Contacto', 'Telefono', 'Email', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proveedoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        {filtro === 'inactivos' ? 'No hay proveedores inactivos' : 'No hay proveedores registrados'}
                      </td>
                    </tr>
                  ) : (
                    proveedoresPag.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{p.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{p.ruc ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{p.contacto ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{p.telefono ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{p.email ?? '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {(rol === 'ADMIN' || rol === 'ALMACENERO') && (
                              <button
                                onClick={() => openEdit(p)}
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {rol === 'ADMIN' && (
                              <button onClick={() => handleToggle(p)} title={p.activo ? 'Desactivar' : 'Activar'}>
                                {p.activo
                                  ? <ToggleRight className="w-6 h-6 text-green-500" />
                                  : <ToggleLeft className="w-6 h-6 text-gray-400" />
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && proveedoresFiltrados.length > 0 && (
            <Pagination total={proveedoresFiltrados.length} page={page} pageSize={10} onChange={setPage} />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <div className="relative">
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  />
                  {rucLoading && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUC <span className="text-xs text-gray-400 font-normal">(autocompleta nombre al completar 11 dígitos)</span>
                </label>
                <input
                  maxLength={11}
                  inputMode="numeric"
                  value={form.ruc}
                  onChange={(e) => { setForm({ ...form, ruc: e.target.value.replace(/\D/g, '') }); setRucError('') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {rucError
                  ? <p className="text-xs text-red-500 mt-1">{rucError}</p>
                  : <p className="text-xs text-gray-400 mt-1">{form.ruc.length}/11 dígitos</p>
                }
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                <input
                  value={form.contacto}
                  onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Telefono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  inputMode="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
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
