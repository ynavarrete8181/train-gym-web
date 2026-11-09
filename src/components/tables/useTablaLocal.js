import { useMemo, useState } from 'react'

/**
 * Filtros tipo Excel y paginación para tablas cuyos datos ya están en el cliente.
 * columnas: { clave: (fila) => texto visible }. Las claves de `sinOrdenar` conservan
 * en el filtro el orden de las filas (por ejemplo, fechas en formato largo).
 */
export function useTablaLocal(filas, columnas, { sinOrdenar = [], porPaginaInicial = 5 } = {}) {
  const [filtros, setFiltros] = useState({})
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(porPaginaInicial)

  const filtradas = useMemo(() => filas.filter((fila) => Object.entries(filtros)
    .every(([clave, valores]) => !valores?.length || valores.includes(String(columnas[clave](fila))))), [filas, filtros, columnas])

  const paginaReal = Math.min(pagina, Math.max(1, Math.ceil(filtradas.length / porPagina)))

  const filtro = (clave) => {
    const valores = [...new Set(filas.map((fila) => String(columnas[clave](fila) ?? '')).filter(Boolean))]
    if (!sinOrdenar.includes(clave)) valores.sort((a, b) => a.localeCompare(b, 'es'))
    return {
      value: filtros[clave] || [],
      options: valores.map((valor) => ({ value: valor, label: valor })),
      onChange: (seleccion) => {
        setFiltros((actual) => ({ ...actual, [clave]: seleccion }))
        setPagina(1)
      },
    }
  }

  return {
    filtro,
    reiniciar: () => {
      setFiltros({})
      setPagina(1)
    },
    visibles: filtradas.slice((paginaReal - 1) * porPagina, paginaReal * porPagina),
    sinResultados: filtradas.length === 0,
    propsTabla: {
      total: filas.length,
      filtrados: filtradas.length,
      page: paginaReal,
      rowsPerPage: porPagina,
      onPageChange: setPagina,
      onRowsPerPageChange: (valor) => {
        setPorPagina(valor)
        setPagina(1)
      },
    },
  }
}
