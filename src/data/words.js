/**
 * words.js
 * --------
 * Banco de palavras em Português de Portugal (5 letras, sem acentos/diacríticos)
 */

const _raw = [
  // Natureza
  "CAMPO", "MONTE", "PEDRA", "FOLHA", "TERRA", "CHUVA", "VENTO", "NUVEM", "PRAIA", "AREIA",
  "FRUTO", "ROCHA", "LINHO", "SELVA", "NEVOA", "LAGOA", "FLORA", "FAUNA", "DUNAS", "BREJO",
  "PRADO", "CAULE", "PINHA", "SEIXO", "BOLHA", "FOSSO", "FONTE", "BRUMA", "CINZA", "FLOCO",
  "GELO", "MORRO",

  // Animais
  "TIGRE", "COBRA", "LEBRE", "BURRO", "POMBO", "PEIXE", "VEADO", "CORVO", "MOSCA", "PULGA",
  "GANSO", "ARARA", "LINCE", "TOURO", "SAPOS", "RATOS", "CISNE", "GARÇA",

  // Corpo
  "DENTE", "NARIZ", "PULSO", "DEDOS", "NERVO", "OSSOS", "CARNE", "PELES", "PELOS", "UNHAS",
  "BOCAS", "LABIO", "NUCA", "TORAX", "AXILA",

  // Casa e objetos
  "PORTA", "GARFO", "LINHA", "GRADE", "CERCA", "LIVRO", "PAPEL", "CARTA", "BANCO", "BOLSO",
  "CAIXA", "COFRE", "CARRO", "BARCO", "PONTE", "TORRE", "MUROS", "BALDE", "FORNO", "COLHE",
  "TACHO", "COPOS", "VIDRO", "METAL", "FERRO", "COBRE", "PRATA", "SOFAS", "CHAVE", "CORDA",
  "FITAS",

  // Ações
  "FALAR", "OUVIR", "OLHAR", "BEBER", "COMER", "ANDAR", "SUBIR", "NADAR", "JOGAR", "LUTAR",
  "REZAR", "DANCA", "SALTO", "SONHO", "GANHO", "PERDA", "FUGIR", "CAVAR", "LAVAR", "SECAR",
  "VIRAR", "GIRAR", "ABRIR", "PUXAR", "BATER", "TOCAR", "LIGAR", "MOVER",

  // Adjetivos
  "VERDE", "FRACO", "FORTE", "BRAVO", "NOBRE", "LENTO", "JUSTO", "FALSO", "DIGNO", "POBRE",
  "MAGRO", "GORDO", "CALMO", "TERNO", "CRUEL", "FEROZ", "FIRME", "CLARO", "LINDO", "TOSCO",
  "BRUTO", "SUAVE", "LARGO", "CURTO", "VELHO",

  // Abstrato
  "RISCO", "CICLO", "CANTO", "TEMPO", "MUNDO", "ORDEM", "PODER", "FORCA", "SABER", "VALOR",
  "HONRA", "SORTE", "NUNCA", "AINDA", "ANTES", "QUASE", "CORPO", "GRITO", "BAIXO", "HAVIA",
  "AGORA", "MESMO", "AMBOS", "DRAMA", "BANDO", "VERSO", "CONTO", "RISOS", "CAUSA", "NORMA",
  "DEVER", "LABOR", "RAZAO", "FATOS", "IDEIA", "SENSO",

  // Alimentação
  "ALHOS", "TRIGO", "MILHO", "FIGOS", "ARROZ", "SOPAS", "CALDO", "NATAS", "LEITE", "CREME",
  "DOCES", "TORTA", "BOLO", "PERAS", "MAÇAS", "LIMAO", "MANGA", "MELAO", "AMEND", "NOZES",

  // Tempo e calendário
  "JUNHO", "MARCO", "ABRIL", "JULHO", "TARDE", "NOITE", "MANHA", "ONTEM", "CEDO", "PRAZO",
  "DATAS", "HORAS", "MESES",

  // Lugares
  "LARGO", "PRACA", "BAIRRO", "CAMPO", "FUNDO", "SITIO", "RUINA", "VIELA", "SOLAR", "PATIO",
  "ADEGA", "CAVES", "EIRAS", "ALDEI", "VILAS",

  // Crime e lei
  "PRESO", "JUIZO", "CRIME", "PENAS", "CULPA", "PLANO", "MULTA", "PROVA", "CELAS",

  // Letras e cultura
  "PROSA", "AUTOR", "TEXTO", "POEMA", "RITMO", "MITOS", "LENDA",

  // Outros / miscelânea
  "FILHO", "COISA", "OLHOS", "HAVIA", "FRUTO", "DIGNO",
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