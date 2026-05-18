'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Cliente } from '@/lib/types'
import { Plus, Search, X, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import Pagination from '@/components/Pagination'

interface ClienteForm {
  nombre: string
  dni: string
  telefono: string
  email: string
  direccion: string
}

const initialForm: ClienteForm = { nombre: '', dni: '', telefono: '', email: '', direccion: '' }

const fields: { key: keyof ClienteForm; label: string; required: boolean; type: string }[] = [
  { key: 'nombre', label: 'Nombre *', required: true, type: 'text' },
  { key: 'dni', label: 'DNI', required: false, type: 'text' },
  { key: 'telefono', label: 'Telefono', required: false, type: 'text' },
  { key: 'email', label: 'Email', required: false, type: 'email' },
  { key: 'direccion', label: 'Direccion', required: false, type: 'text' },
]

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ClienteForm>(initialForm)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'activos' | 'inactivos' | 'todos'>('activos')
  const [saving, setSaving] = useState(false)
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
        (c.dni ?? '').toLowerCase().includes(q) ||
        (c.telefono ?? '').includes(q)
      )
    }
    return true
  })

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(initialForm) }

  const openEdit = (c: Cliente) => {
    setEditId(c.id)
    setForm({
      nombre: c.nombre,
      dni: c.dni ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
    })
    setShowModal(true)
  }

  const buildBody = () => ({
    nombre: form.nombre,
    ...(form.dni && { dni: form.dni }),
    ...(form.telefono && { telefono: form.telefono }),
    ...(form.email && { email: form.email }),
    ...(form.direccion && { direccion: form.direccion }),
  })

  const handleSubmit = async (e: React.FormEvent) => {
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
              placeholder="Buscar por nombre o DNI..."
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {['Nombre', 'DNI', 'Telefono', 'Email', 'Direccion', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
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
                {fields.map(({ key, label, required, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      required={required}
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
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
