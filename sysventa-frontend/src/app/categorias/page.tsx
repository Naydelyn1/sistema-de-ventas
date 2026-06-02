'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Categoria } from '@/lib/types'
import { Plus, Pencil, X, Check, Tag, ToggleLeft, ToggleRight, Search, AlertTriangle } from 'lucide-react'

const PALETA = [
  { bg: 'bg-blue-100',   icon: 'text-blue-500'   },
  { bg: 'bg-purple-100', icon: 'text-purple-500' },
  { bg: 'bg-green-100',  icon: 'text-green-500'  },
  { bg: 'bg-orange-100', icon: 'text-orange-500' },
  { bg: 'bg-pink-100',   icon: 'text-pink-500'   },
  { bg: 'bg-teal-100',   icon: 'text-teal-500'   },
  { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
  { bg: 'bg-indigo-100', icon: 'text-indigo-500' },
]

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'activas' | 'inactivas' | 'todas'>('activas')
  const [toggleConfirm, setToggleConfirm] = useState<{
    id: number; activo: boolean; nombre: string; numProductos: number
  } | null>(null)
  const [toggling, setToggling] = useState(false)
  const { toast, showToast, closeToast } = useToast()

  const load = async () => {
    try {
      const res = await api.get<Categoria[]>('/categorias?todos=true')
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
      } else {
        setFormError('Error al guardar la categoría.')
      }
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (cat: Categoria) => {
    setEditId(cat.id)
    setNombre(cat.nombre)
    setShowForm(true)
  }

  const requestToggle = (cat: Categoria) => {
    setToggleConfirm({
      id: cat.id,
      activo: cat.activo ?? true,
      nombre: cat.nombre,
      numProductos: cat._count?.productos ?? 0,
    })
  }

  const confirmToggle = async () => {
    if (!toggleConfirm) return
    setToggling(true)
    try {
      await api.patch(`/categorias/${toggleConfirm.id}/toggle`)
      load()
      showToast(toggleConfirm.activo ? 'Categoría desactivada' : 'Categoría activada')
    } catch {
      showToast('Error al cambiar el estado de la categoría', 'error')
    } finally {
      setToggling(false)
      setToggleConfirm(null)
    }
  }

  const categoriasFiltradas = categorias
    .filter((c) => {
      if (filtro === 'activas' && !c.activo) return false
      if (filtro === 'inactivas' && c.activo) return false
      if (busqueda) return c.nombre.toLowerCase().includes(busqueda.toLowerCase())
      return true
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const totalActivas = categorias.filter((c) => c.activo).length
  const totalInactivas = categorias.filter((c) => !c.activo).length

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="mr-auto">
            <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
            <p className="text-sm text-gray-400 mt-0.5">{totalActivas} activa{totalActivas !== 1 ? 's' : ''}</p>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['activas', 'inactivas', 'todas'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setFiltro(op)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  filtro === op ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {op === 'activas' ? `Activas (${totalActivas})`
                  : op === 'inactivas' ? `Inactivas (${totalInactivas})`
                  : 'Todas'}
              </button>
            ))}
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

            {/* Tarjeta de formulario */}
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

            {/* Tarjetas */}
            {categoriasFiltradas.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                {busqueda
                  ? `Sin resultados para "${busqueda}"`
                  : filtro === 'inactivas'
                  ? 'No hay categorías inactivas'
                  : 'No hay categorías registradas'}
              </div>
            ) : (
              categoriasFiltradas.map((cat) => {
                const color = PALETA[cat.id % PALETA.length]
                const numProductos = cat._count?.productos ?? 0
                return (
                  <div
                    key={cat.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 transition-all ${
                      cat.activo ? 'hover:shadow-md hover:border-gray-200' : 'opacity-60'
                    }`}
                  >
                    {/* Icono */}
                    <div className={`w-11 h-11 rounded-xl ${color.bg} flex items-center justify-center`}>
                      <Tag className={`w-5 h-5 ${color.icon}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{cat.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {numProductos} producto{numProductos !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Badge estado */}
                    <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {cat.activo ? 'Activa' : 'Inactiva'}
                    </span>

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
                        onClick={() => requestToggle(cat)}
                        title={cat.activo ? 'Desactivar' : 'Activar'}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                      >
                        {cat.activo
                          ? <ToggleRight className="w-4 h-4 text-green-500" />
                          : <ToggleLeft className="w-4 h-4 text-gray-400" />
                        }
                        {cat.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de toggle */}
      {toggleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full shrink-0 ${toggleConfirm.activo ? 'bg-orange-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${toggleConfirm.activo ? 'text-orange-500' : 'text-green-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {toggleConfirm.activo ? 'Desactivar categoría' : 'Activar categoría'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta acción también afecta a sus productos</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              ¿{toggleConfirm.activo ? 'Desactivar' : 'Activar'} la categoría{' '}
              <span className="font-semibold text-gray-900">"{toggleConfirm.nombre}"</span>?
            </p>

            {toggleConfirm.numProductos > 0 && (
              <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg mb-4 ${
                toggleConfirm.activo ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
              }`}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Los <strong>{toggleConfirm.numProductos} producto{toggleConfirm.numProductos !== 1 ? 's' : ''}</strong> de esta categoría también serán {toggleConfirm.activo ? 'desactivados' : 'activados'}.
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setToggleConfirm(null)}
                disabled={toggling}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmToggle}
                disabled={toggling}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 ${
                  toggleConfirm.activo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {toggling ? 'Procesando...' : toggleConfirm.activo ? 'Sí, desactivar' : 'Sí, activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
