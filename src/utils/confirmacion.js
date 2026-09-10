import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { uiTokens } from '../styles/uiTokens.js'

export async function confirmarAccion({
  titulo = 'Confirmar acción',
  texto = '¿Deseas continuar?',
  textoConfirmar = 'Sí, continuar',
  textoCancelar = 'Cancelar',
  icono = 'question',
} = {}) {
  const resultado = await Swal.fire({
    title: titulo,
    text: texto,
    icon: icono,
    showCancelButton: true,
    confirmButtonText: `<span class="material-symbols-outlined base-swal-button-icon">check_circle</span><span>${textoConfirmar}</span>`,
    cancelButtonText: `<span class="material-symbols-outlined base-swal-button-icon">close</span><span>${textoCancelar}</span>`,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      container: 'base-swal-container',
      popup: 'base-swal-popup',
      title: 'base-swal-title',
      htmlContainer: 'base-swal-text',
      actions: 'base-swal-actions',
      confirmButton: 'base-swal-confirm',
      cancelButton: 'base-swal-cancel',
    },
    didOpen: () => {
      const styleId = 'base-swal-styles'
      document.getElementById(styleId)?.remove()

      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .swal2-container.base-swal-container {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 20000 !important;
        }
        .base-swal-popup {
          border-radius: 12px;
          border: 1px solid ${uiTokens.colores.borde};
          font-family: ${uiTokens.tipografia.familia};
          padding: 22px 24px 20px;
        }
        .base-swal-title {
          color: ${uiTokens.colores.textoFuerte};
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0;
        }
        .base-swal-text {
          color: ${uiTokens.colores.textoMedio};
          font-size: 13px;
          font-weight: 650;
        }
        .base-swal-actions {
          gap: 10px;
        }
        .base-swal-confirm,
        .base-swal-cancel {
          height: 38px !important;
          min-width: 128px !important;
          border-radius: 4px !important;
          padding: 0 16px !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          cursor: pointer;
          background: #fff !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          line-height: 1 !important;
          box-shadow: none !important;
        }
        .base-swal-confirm {
          border: 1px solid ${uiTokens.colores.exito} !important;
          color: ${uiTokens.colores.exito} !important;
        }
        .base-swal-confirm:hover {
          background: rgba(8, 127, 91, 0.08) !important;
        }
        .base-swal-cancel {
          border: 1px solid ${uiTokens.colores.secundario} !important;
          color: ${uiTokens.colores.secundario} !important;
        }
        .base-swal-cancel:hover {
          background: ${uiTokens.colores.secundarioSuave} !important;
        }
        .base-swal-button-icon {
          width: 17px;
          height: 17px;
          font-size: 17px !important;
          line-height: 17px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
      `
      document.head.appendChild(style)
    },
  })

  return resultado.isConfirmed
}
