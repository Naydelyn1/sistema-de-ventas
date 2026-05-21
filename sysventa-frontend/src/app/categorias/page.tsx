'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Categoria } from '@/lib/types'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Tag } from 'lucide-react'

const PALETA = [
  { bg: 'bg-blue-100',   icon: 'text-blue-500',   ring: 'ring-blue-200',   nombre: 'blue'   },
  { bg: 'bg-purple-100', icon: 'text-purple-500', ring: 'ring-purple-200', nombre: 'purple' },
  { bg: 'bg-green-100',  icon: 'text-green-500',  ring: 'ring-green-200',  nombre: 'green'  },
  { bg: 'bg-orange-100', icon: 'text-orange-500', ring: 'ring-orange-200', nombre: 'orange' },
  { bg: 'bg-pink-100',   icon: 'text-pink-500',   ring: 'ring-pink-200',   nombre: 'pink'   },
  { bg: 'bg-teal-100',   icon: 'text-teal-500',   ring: 'ring-teal-200',   nombre: 'teal'   },
  { bg: 'bg-yellow-100', icon: 'text-yellow-600', ring: 'ring-yellow-200', nombre: 'yellow' },
  { bg: 'bg-indigo-100', icon: 'text-indigo-500', ring: 'ring-indigo-200', nombre: 'indigo' },
]

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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
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
      } else {
        setFormError('Error al guardar la categoría.')
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

  const sortedCategorias = [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
            <p className="text-sm text-gray-400 mt-0.5">{categorias.length} categoría{categorias.length !== 1 ? 's' : ''} registrada{categorias.length !== 1 ? 's' : ''}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditId(null); setNombre('') }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

            {/* Tarjeta de formulario (nueva / editar) */}
            {showForm && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5">
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {editId ? 'Editar categoría' : 'Nueva categoría'}
                  </p>
                  <form onSubmit={handleSave} className="flex gap-3 items-start">
                    <div className="flex-1">
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
                    <button type="submit" disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={closeForm}
                      className="border border-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tarjetas de categorías */}
            {sortedCategorias.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                No hay categorías registradas
              </div>
            ) : (
              sortedCategorias.map((cat, i) => {
                const color = PALETA[i % PALETA.length]
                return (
                  <div key={cat.id}
                    className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all p-4 flex flex-col gap-3"
                  >
                    {/* Icono */}
                    <div className={`w-11 h-11 rounded-xl ${color.bg} flex items-center justify-center`}>
                      <Tag className={`w-5 h-5 ${color.icon}`} />
                    </div>

                    {/* Nombre */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{cat.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">ID #{cat.id}</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => startEdit(cat)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => openDelete(cat)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })
            )}

          </div>
        )}
      </div>

      {/* Modal eliminar */}
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
              <button onClick={closeDelete}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
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
