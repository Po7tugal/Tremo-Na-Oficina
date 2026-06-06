/**
 * words.js
 * --------
 * Banco de palavras em Português de Portugal (5 letras, sem acentos/diacríticos)
 */

const _raw = [
  "CAMPO", "MONTE", "PEDRA", "FOLHA", "TERRA",
  "CHUVA", "VENTO", "NUVEM", "PRAIA", "AREIA",
  "FRUTO", "ROCHA", "TIGRE", "COBRA", "LEBRE",
  "BURRO", "POMBO", "PEIXE", "VEADO", "CORVO",
  "DENTE", "NARIZ", "PULSO", "DEDOS", "NERVO",
  "PORTA", "COLHE", "GARFO", "VERDE", "LINHA",
  "RISCO", "CICLO", "SALTO", "DANCA", "SONHO",
  "RISOS", "CANTO", "TEMPO", "MUNDO", "ORDEM",
  "PODER", "FORCA", "SABER", "VALOR", "HONRA",
  "ALHOS", "FALAR", "SORTE", "FILHO", "COISA",
  "NUNCA", "AINDA", "ANTES", "QUASE", "JUNHO",
  "MARCO", "ABRIL", "JULHO", "BARCO", "CARRO",
  "PONTE", "BAIRRO", "LARGO", "PRACA", "TORRE",
  "MUROS", "GRADE", "CERCA", "LIVRO", "PAPEL",
  "CARTA", "CONTO", "VERSO", "DRAMA", "BANDO",
  "CORPO", "GRITO", "BAIXO", "OLHAR", "HAVIA",
  "AGORA", "MESMO", "AMBOS", "FRACO", "FORTE",
  "BRAVO", "NOBRE", "LENTO", "JUSTO", "FALSO",
  "DIGNO", "POBRE", "MAGRO", "GORDO", "CALMO",
  "TRIGO", "MILHO", "FIGOS", "BANCO", "BOLSO",
  "CAIXA", "COFRE", "PRESO", "JUIZO", "CRIME",
  "PENAS", "CULPA", "PLANO", "OUVIR", "OLHOS",
  "BEBER", "COMER", "ANDAR", "SUBIR", "NADAR",
  "JOGAR", "GANHO", "PERDA", "LUTAR", "REZAR",
];

const _seen = new Set();
export const SECRET_WORDS = _raw.filter(w => {
  if (w.length !== 5) return false;
  if (!/^[A-Z]+$/.test(w)) return false;
  if (_seen.has(w)) return false;
  _seen.add(w);
  return true;
});

export const VALID_WORDS = new Set([
  ...SECRET_WORDS,
  "ACASO", "ACENO", "ACESO", "ACIMA", "ACUSA",
  // ... resto das palavras válidas
]);

export function getRandomWord() {
  const words = SECRET_WORDS.length > 0 ? SECRET_WORDS : ["CAMPO", "PEDRA", "CHUVA", "VENTO", "PRAIA"];
  return words[Math.floor(Math.random() * words.length)];
}

export function isValidWord(word) {
  return VALID_WORDS.has(word.toUpperCase()) || SECRET_WORDS.includes(word.toUpperCase());
}