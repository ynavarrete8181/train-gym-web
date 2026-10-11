import { faDownload, faFileCsv, faFileExcel, faFilePdf, faFileWord } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const iconos = {
  csv: faFileCsv,
  excel: faFileExcel,
  xls: faFileExcel,
  xlsx: faFileExcel,
  pdf: faFilePdf,
  word: faFileWord,
  doc: faFileWord,
  docx: faFileWord,
  descarga: faDownload,
  download: faDownload,
}

export function IconoArchivo({ tipo = 'descarga', size = 18, style = {}, ...props }) {
  const icono = iconos[String(tipo).toLowerCase()] || faDownload

  return <FontAwesomeIcon icon={icono} style={{ fontSize: size, ...style }} {...props} />
}
