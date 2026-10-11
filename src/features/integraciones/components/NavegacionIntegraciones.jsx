import { PestanasEstandar } from '../../../components/common/PestanasEstandar.jsx'

const secciones = [
  { value: 0, label: 'Proveedores' },
  { value: 1, label: 'Servicios' },
  { value: 2, label: 'Autenticación' },
]

export function NavegacionIntegraciones({ value, onChange }) {
  return <PestanasEstandar value={value} onChange={onChange} opciones={secciones} sx={{ mb: 2.5 }} />
}
