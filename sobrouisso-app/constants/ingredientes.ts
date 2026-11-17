// constants/ingredientes.ts
// Descobre um emoji para cada ingrediente (🍚 arroz, 🥚 ovo, 🍅 tomate...).
// Se o ingrediente não estiver na lista, usa um ícone genérico.

// Atenção à ORDEM: a busca para no primeiro que combinar. "macarrao" vem
// antes de "maca" para o macarrão não virar uma maçã.
const ICONES: Record<string, string> = {
  macarrao: "🍝",
  arroz: "🍚",
  ovo: "🥚",
  tomate: "🍅",
  cebola: "🧅",
  alho: "🧄",
  batata: "🥔",
  cenoura: "🥕",
  frango: "🍗",
  carne: "🥩",
  bife: "🥩",
  linguica: "🌭",
  salsicha: "🌭",
  bacon: "🥓",
  peixe: "🐟",
  camarao: "🍤",
  queijo: "🧀",
  leite: "🥛",
  pao: "🍞",
  feijao: "🍲",
  milho: "🌽",
  brocolis: "🥦",
  alface: "🥬",
  cogumelo: "🍄",
  banana: "🍌",
  maca: "🍎",
  limao: "🍋",
  laranja: "🍊",
  abacate: "🥑",
  abacaxi: "🍍",
  morango: "🍓",
  uva: "🍇",
  coco: "🥥",
  berinjela: "🍆",
  abobora: "🎃",
};

// Tira acentos e deixa minúsculo: "Feijão" -> "feijao".
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function iconeDoIngrediente(nome: string): string {
  const procurado = normalizar(nome);
  for (const [chave, icone] of Object.entries(ICONES)) {
    if (procurado.includes(chave)) return icone;
  }
  return "🍴";
}
