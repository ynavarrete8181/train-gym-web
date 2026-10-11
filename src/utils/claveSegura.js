export const requisitosClave = [
  { id: "longitud", texto: "8 caracteres como mínimo", cumple: (valor) => valor.length >= 8 },
  { id: "mayuscula", texto: "Una letra mayúscula", cumple: (valor) => /[A-ZÁÉÍÓÚÑ]/.test(valor) },
  { id: "minuscula", texto: "Una letra minúscula", cumple: (valor) => /[a-záéíóúñ]/.test(valor) },
  { id: "numero", texto: "Un número", cumple: (valor) => /\d/.test(valor) },
  { id: "simbolo", texto: "Un símbolo", cumple: (valor) => /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(valor) },
];

export function claveEsSegura(valor = "") {
  return requisitosClave.every((requisito) => requisito.cumple(valor));
}
