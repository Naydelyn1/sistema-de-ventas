'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Categoria } from '@/lib/types'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteNombre, setDeleteNombre] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [page, setPage] = useState(1)
  const { toast, showToast, closeToast } = useToast()

  const load = async () => {
    try {
      const res = await api.get<Categoria[]>('/categorias')
      setCategorias(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const closeForm = () => { setShowForm(false); setEditId(null); setNombre(''); setFormError('') }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editId) {
        await api.patch(`/categorias/${editId}`, { nombre })
        showToast('Categoría actualizada correctamente')
      } else {
        await api.post('/categorias', { nombre })
        showToast('Categoría creada correctamente')
      }
      closeForm()
      load()
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setFormError('Ya existe una categoría con ese nombre.')
        showToast('Ya existe una categoría con ese nombre', 'warning')
      } else {
        setFormError('Error al guardar la categoría.')
        showToast('Error al guardar la categoría', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (cat: Categoria) => {
    setDeleteId(cat.id)
    setDeleteNombre(cat.nombre)
    setDeleteError('')
  }

  const closeDelete = () => { setDeleteId(null); setDeleteNombre(''); setDeleteError('') }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/categorias/${deleteId}`)
      closeDelete()
      load()
      showToast('Categoría eliminada correctamente')
    } catch {
      setDeleteError('No se puede eliminar: esta categoría tiene productos asociados.')
    } finally {
      setDeleting(false)
    }
  }

  const startEdit = (cat: Categoria) => {
    setEditId(cat.id)
    setNombre(cat.nombre)
    setShowForm(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Categorias</h2>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setNombre('') }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoria
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSave} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editId ? 'Editar nombre' : 'Nombre de la categoria'}
                </label>
                <input
                  required
                  autoFocus
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setFormError('') }}
                  placeholder="Ej: Medicamentos"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formError ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {formError && <p className="text-xs text-red-600 mt-1">{formError}</p>}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button type="button" onClick={closeForm} className="border border-gray-300 text-gray-500 p-2 rounded-lg hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorias.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">No hay categorias registradas</td></tr>
                ) : (
                  categorias.slice((page - 1) * 10, page * 10).map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-400">{cat.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{cat.nombre}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(cat)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDelete(cat)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          {!loading && categorias.length > 0 && (
            <Pagination total={categorias.length} page={page} pageSize={10} onChange={setPage} />
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Eliminar categoría</h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar <span className="font-semibold text-gray-900">"{deleteNombre}"</span>?
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={closeDelete} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
