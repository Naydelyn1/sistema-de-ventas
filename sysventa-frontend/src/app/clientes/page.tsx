'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Cliente } from '@/lib/types'
import { Plus, Search, X, Pencil, ToggleLeft, ToggleRight, Loader2, Users, Building2, User } from 'lucide-react'
import Pagination from '@/components/Pagination'

interface ClienteForm {
  nombre: string
  dni: string
  ruc: string
  telefono: string
  email: string
  direccion: string
}

const initialForm: ClienteForm = { nombre: '', dni: '', ruc: '', telefono: '', email: '', direccion: '' }

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ClienteForm>(initialForm)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'activos' | 'inactivos' | 'todos'>('activos')
  const [saving, setSaving] = useState(false)
  const [dniLoading, setDniLoading] = useState(false)
  const [dniError, setDniError] = useState('')
  const [rucLoading, setRucLoading] = useState(false)
  const [rucError, setRucError] = useState('')
  const [page, setPage] = useState(1)
  const { toast, showToast, closeToast } = useToast()

  const load = async () => {
    try {
      const res = await api.get<Cliente[]>('/clientes?todos=true')
      setClientes(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === 'activos' && !c.activo) return false
    if (filtro === 'inactivos' && c.activo) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.nombre.toLowerCase().includes(q) ||
        (c.dni ?? '').includes(q) ||
        (c.ruc ?? '').includes(q) ||
        (c.telefono ?? '').includes(q)
      )
    }
    return true
  })

  const closeModal = () => {
    setShowModal(false); setEditId(null); setForm(initialForm)
    setDniError(''); setRucError('')
  }

  const buscarDni = async () => {
    if (form.dni.length !== 8) return
    setDniLoading(true)
    setDniError('')
    try {
      const res = await api.get(`/clientes/reniec/${form.dni}`)
      setForm((prev) => ({ ...prev, nombre: res.data.nombre }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'No se pudo obtener datos del DNI'
      setDniError(msg)
    } finally {
      setDniLoading(false)
    }
  }

  const buscarRuc = async () => {
    if (form.ruc.length !== 11) return
    setRucLoading(true)
    setRucError('')
    try {
      const res = await api.get<{ razonSocial: string }>(`/facturacion/ruc/${form.ruc}`)
      setForm((prev) => ({ ...prev, nombre: res.data.razonSocial }))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'RUC no encontrado en SUNAT'
      setRucError(msg)
    } finally {
      setRucLoading(false)
    }
  }

  const openEdit = (c: Cliente) => {
    setEditId(c.id)
    setForm({
      nombre: c.nombre,
      dni: c.dni ?? '',
      ruc: c.ruc ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
    })
    setShowModal(true)
  }

  const buildBody = () => ({
    nombre: form.nombre,
    ...(form.dni && { dni: form.dni }),
    ...(form.ruc && { ruc: form.ruc }),
    ...(form.telefono && { telefono: form.telefono }),
    ...(form.email && { email: form.email }),
    ...(form.direccion && { direccion: form.direccion }),
  })

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.patch(`/clientes/${editId}`, buildBody())
        showToast('Cliente actualizado correctamente')
      } else {
        await api.post('/clientes', buildBody())
        showToast('Cliente registrado correctamente')
      }
      closeModal()
      load()
    } catch {
      showToast('Error al guardar el cliente', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (c: Cliente) => {
    try {
      await api.patch(`/clientes/${c.id}/toggle`)
      load()
      showToast(c.activo ? 'Cliente desactivado' : 'Cliente activado')
    } catch {
      showToast('Error al cambiar el estado del cliente', 'error')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-700 mr-auto">Clientes</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nombre, DNI o RUC..."
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1) }}
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
                  filtro === op ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {op === 'activos' ? `Activos (${clientes.filter(c => c.activo).length})`
                  : op === 'inactivos' ? `Inactivos (${clientes.filter(c => !c.activo).length})`
                  : 'Todos'}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditId(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Activos</p>
              <p className="text-2xl font-bold text-gray-800">{clientes.filter(c => c.activo).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Empresas (RUC)</p>
              <p className="text-2xl font-bold text-gray-800">{clientes.filter(c => c.activo && c.ruc).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Personas (DNI)</p>
              <p className="text-2xl font-bold text-gray-800">{clientes.filter(c => c.activo && c.dni).length}</p>
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
                    {['Nombre', 'DNI', 'RUC', 'Telefono', 'Email', 'Direccion', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        {search
                          ? `Sin resultados para "${search}"`
                          : filtro === 'inactivos'
                          ? 'No hay clientes inactivos'
                          : 'No hay clientes registrados'}
                      </td>
                    </tr>
                  ) : (
                    clientesFiltrados.slice((page - 1) * 10, page * 10).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{c.nombre}</td>
                        <td className="px-6 py-4 text-gray-500">{c.dni ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{c.ruc ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{c.telefono ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{c.email ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{c.direccion ?? '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {c.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEdit(c)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggle(c)}
                              title={c.activo ? 'Desactivar' : 'Activar'}
                            >
                              {c.activo
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
          {!loading && clientesFiltrados.length > 0 && (
            <Pagination total={clientesFiltrados.length} page={page} pageSize={10} onChange={setPage} />
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editId ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                <button onClick={closeModal}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={8}
                      value={form.dni}
                      onChange={(e) => { setForm({ ...form, dni: e.target.value }); setDniError('') }}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={buscarDni}
                      disabled={dniLoading || form.dni.length !== 8}
                      title="Buscar en RENIEC"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-40 flex items-center"
                    >
                      {dniLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                  {dniError && <p className="text-xs text-red-500 mt-1">{dniError}</p>}
                </div>

                {/* RUC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC <span className="text-xs text-gray-400 font-normal">(autocompleta razón social)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={11}
                      value={form.ruc}
                      onChange={(e) => { setForm({ ...form, ruc: e.target.value.replace(/\D/g, '') }); setRucError('') }}
                      placeholder="20xxxxxxxxx"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={buscarRuc}
                      disabled={rucLoading || form.ruc.length !== 11}
                      title="Buscar en SUNAT"
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm disabled:opacity-40 flex items-center"
                    >
                      {rucLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                  {rucError && <p className="text-xs text-red-500 mt-1">{rucError}</p>}
                </div>

                {/* Telefono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
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

                {/* Direccion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
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
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
