// constants/temas.ts
// Todas as cores do app ficam aqui. Quer mudar a identidade visual?
// Troque os valores neste arquivo e o app inteiro muda junto.
//
// Paleta do design: fundo creme, laranja queimado nos botões e verde-escuro
// na marca. O tema escuro usa os mesmos "papéis" de cor, só que mais escuros.

export type NomeTema = "claro" | "escuro";

export const temas = {
  claro: {
    fundo: "#FBF6EC", // creme (fundo das telas)
    superficie: "#FFFDF8", // campos e cartões
    texto: "#2B2B26",
    textoSecundario: "#6B6A62",
    borda: "#E4DCCB",
    primaria: "#C4501B", // laranja queimado (botões, destaques)
    textoSobrePrimaria: "#FFFFFF",
    verde: "#1F4D2E", // verde da marca ("Sobrou")
    titulo: "#5B2A17", // marrom do título da receita
    chip: "#DDD9D2", // etiquetas cinza dos ingredientes
    erro: "#B3261E",
    sucesso: "#2E7D32",
  },
  escuro: {
    fundo: "#1B1712",
    superficie: "#262019",
    texto: "#F3EBDD",
    textoSecundario: "#B4A999",
    borda: "#3B3328",
    primaria: "#D45A22",
    textoSobrePrimaria: "#FFFFFF",
    verde: "#8FD0A0",
    titulo: "#F0C9A8",
    chip: "#3A332A",
    erro: "#FF8A80",
    sucesso: "#7BD88F",
  },
};

export type Cores = typeof temas.claro;
