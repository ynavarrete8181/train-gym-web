import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';

// Filtro tipo Excel con los valores que entrega el backend en `opciones_filtro`.
export function FiltroColumna({ columna, filtros, opciones, aplicar, formato, children, ...props }) {
  return (
    <FilterHeaderCell
      multiple
      value={filtros.columnas?.[columna] || []}
      onChange={(valores) => aplicar({ columnas: { ...filtros.columnas, [columna]: valores } })}
      options={(opciones?.[columna] || []).map((valor) => ({ value: valor, label: formato ? formato(valor) : valor }))}
      {...props}
    >
      {children}
    </FilterHeaderCell>
  );
}
