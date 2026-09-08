'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import api from '@/lib/axios'
import { Producto, Categoria } from '@/lib/types'
import { Plus, AlertTriangle, ToggleLeft, ToggleRight, X, Pencil, Search, Package, ShieldAlert, Tag, Upload, Trash2, ImageIcon } from 'lucide-react'
import Pagination from '@/components/Pagination'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface ProductoForm {
  nombre: string
  descripcion: string
  precio: string
  stock: string
  stockMinimo: string
  categoriaId: string
  lote: string
  fechaVencimiento: string
  registroSanitario: string
  presentacion: string
  imagenUrl: string
}

const initialForm: ProductoForm = {
  nombre: '', descripcion: '', precio: '', stock: '',
  stockMinimo: '', categoriaId: '', lote: '',
  fechaVencimiento: '', registroSanitario: '', presentacion: '',
  imagenUrl: '',
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductoForm>(initialForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [previewModalUrl, setPreviewModalUrl] = useState<{ url: string; nombre: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('activos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const { toast, showToast, closeToast } = useToast()

  const load = async () => {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.get<Producto[]>('/productos?todos=true'),
        api.get<Categoria[]>('/categorias'),
      ])
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data)
      if (catRes.status === 'fulfilled') setCategorias(catRes.value.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const productosFiltrados = productos.filter((p) => {
    if (filtro === 'activos' && !p.activo) return false
    if (filtro === 'inactivos' && p.activo) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria?.nombre ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })
  const productosPag = productosFiltrados.slice((page - 1) * 10, page * 10)

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm(initialForm)
    setSelectedFile(null)
    setImagePreview(null)
    setError('')
  }

  const openEdit = (p: Producto) => {
    setEditId(p.id)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      stock: String(p.stock),
      stockMinimo: String(p.stockMinimo),
      categoriaId: String(p.categoriaId),
      lote: p.lote ?? '',
      fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.split('T')[0] : '',
      registroSanitario: p.registroSanitario ?? '',
      presentacion: p.presentacion ?? '',
      imagenUrl: p.imagenUrl ?? '',
    })
    setImagePreview(p.imagenUrl ? `${API_URL}${p.imagenUrl}` : null)
    setSelectedFile(null)
    setShowModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      setError('Formato inválido. Solo se admiten imágenes JPG, PNG, WEBP o GIF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5 MB')
      return
    }
    setError('')
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setForm((prev) => ({ ...prev, imagenUrl: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const body = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock),
      stockMinimo: parseInt(form.stockMinimo),
      categoriaId: parseInt(form.categoriaId),
      lote: form.lote || undefined,
      fechaVencimiento: form.fechaVencimiento
        ? new Date(form.fechaVencimiento).toISOString()
        : undefined,
      registroSanitario: form.registroSanitario || undefined,
      presentacion: form.presentacion || undefined,
    }
    try {
      let finalImagenUrl: string | null = form.imagenUrl || null

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadRes = await api.post<{ url: string }>('/productos/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        finalImagenUrl = uploadRes.data.url
      } else if (!imagePreview) {
        finalImagenUrl = null
      }

      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock),
        stockMinimo: parseInt(form.stockMinimo),
        categoriaId: parseInt(form.categoriaId),
        lote: form.lote || undefined,
        fechaVencimiento: form.fechaVencimiento
          ? new Date(form.fechaVencimiento).toISOString()
          : undefined,
        registroSanitario: form.registroSanitario || undefined,
        presentacion: form.presentacion || undefined,
        imagenUrl: finalImagenUrl,
      }

      if (editId) {
        await api.patch(`/productos/${editId}`, body)
        showToast('Producto actualizado correctamente')
      } else {
        await api.post('/productos', body)
        showToast('Producto creado correctamente')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al guardar el producto'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: number, activo: boolean) => {
    try {
      await api.patch(`/productos/${id}/toggle`)
      load()
      showToast(activo ? 'Producto desactivado' : 'Producto activado')
    } catch {
      showToast('Error al cambiar el estado del producto', 'error')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-700 mr-auto">Productos</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto o categoría..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
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
                {op === 'activos' ? `Activos (${productos.filter(p => p.activo).length})`
                  : op === 'inactivos' ? `Inactivos (${productos.filter(p => !p.activo).length})`
                  : 'Todos'}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditId(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Activos</p>
              <p className="text-2xl font-bold text-gray-800">{productos.filter(p => p.activo).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Stock bajo</p>
              <p className="text-2xl font-bold text-gray-800">{productos.filter(p => p.activo && p.stock <= p.stockMinimo).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Categorías</p>
              <p className="text-2xl font-bold text-gray-800">{new Set(productos.map(p => p.categoriaId)).size}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        {busqueda
                          ? `Sin resultados para "${busqueda}"`
                          : filtro === 'inactivos'
                          ? 'No hay productos inactivos'
                          : 'No hay productos registrados'}
                      </td>
                    </tr>
                  ) : (
                    productosPag.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {p.imagenUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewModalUrl({ url: `${API_URL}${p.imagenUrl}`, nombre: p.nombre })}
                                className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer group"
                                title="Clic para ampliar imagen"
                              >
                                <img
                                  src={`${API_URL}${p.imagenUrl}`}
                                  alt={p.nombre}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                              </button>
                            ) : (
                              <div
                                className="w-10 h-10 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400"
                                title="Sin imagen"
                              >
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{p.nombre}</span>
                                {p.stock <= p.stockMinimo && (
                                  <span title="Stock bajo"><AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" /></span>
                                )}
                              </div>
                              {p.presentacion && (
                                <span className="text-xs text-gray-400 block">{p.presentacion}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{p.categoria?.nombre ?? '-'}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          S/ {(Number(p.precio) || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={p.stock <= p.stockMinimo ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                            {p.stock}
                          </span>
                          <span className="text-gray-400 text-xs"> / min {p.stockMinimo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggle(p.id, p.activo)}
                              title={p.activo ? 'Desactivar' : 'Activar'}
                            >
                              {p.activo
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
          {!loading && productosFiltrados.length > 0 && (
            <Pagination total={productosFiltrados.length} page={page} pageSize={10} onChange={setPage} />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editId ? 'Editar Producto' : 'Agregar Producto'}
              </h3>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Foto del producto */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Foto del producto <span className="text-xs font-normal text-gray-400">(Opcional)</span>
                  </label>
                  {imagePreview ? (
                    <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 bg-white shrink-0 shadow-xs">
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-gray-700">Imagen del producto</p>
                        <p className="text-[11px] text-gray-400">Esta imagen se mostrará en el catálogo y en ventas</p>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="cursor-pointer px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-300 rounded-lg transition-colors inline-block shadow-xs">
                            Cambiar foto
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-4 cursor-pointer bg-gray-50/60 hover:bg-blue-50/30 transition-all text-center group">
                      <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-blue-600 mb-1.5 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        Subir foto del medicamento o producto
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG o WEBP (máx. 5 MB)</p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input
                    required
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select
                    required
                    value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial *</label>
                  <input
                    required
                    inputMode="numeric"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock minimo *</label>
                  <input
                    required
                    inputMode="numeric"
                    placeholder="0"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
                  <select
                    value={form.presentacion}
                    onChange={(e) => setForm({ ...form, presentacion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="UNIDAD">Unidad</option>
                    <option value="CAJA">Caja</option>
                    <option value="BLISTER">Blister</option>
                    <option value="FRASCO">Frasco</option>
                    <option value="AMPOLLA">Ampolla</option>
                    <option value="TUBO">Tubo</option>
                    <option value="LATA">Lata</option>
                    <option value="VIDRIO">Vidrio</option>
                    <option value="BOLSA">Bolsa</option>
                    <option value="SOBRE">Sobre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                  <input
                    value={form.lote}
                    onChange={(e) => setForm({ ...form, lote: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha vencimiento</label>
                  <input
                    type="date"
                    value={form.fechaVencimiento}
                    onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registro sanitario</label>
                  <input
                    value={form.registroSanitario}
                    onChange={(e) => setForm({ ...form, registroSanitario: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver imagen ampliada */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800 truncate pr-2">
                {previewModalUrl.nombre}
              </h4>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewModalUrl.url}
                alt={previewModalUrl.nombre}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
