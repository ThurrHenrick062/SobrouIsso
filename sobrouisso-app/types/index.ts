// types/index.ts
// Os "moldes" dos dados que circulam pelo app. O TypeScript usa isso para
// avisar quando você esquece um campo ou digita o nome errado.
// Estes formatos são o "contrato" com o backend: o servidor deve devolver
// exatamente esses campos.

import type { NomeTema } from "@/constants/temas";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tema: NomeTema;
}

export interface Receita {
  id: number;
  titulo: string;
  descricao: string;
  tempoPreparo: string;
  dificuldade?: string; // opcional, ex.: "Muito fácil"
  ingredientes: string[]; // lista completa da receita
  modoPreparo: string[]; // um item por passo
  ingredientesBusca: string[]; // o que o usuário digitou na Home
  favorito: boolean;
  criadoEm: string; // data em formato ISO
}

export interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

export interface DadosPerfil {
  nome: string;
  email: string;
  senha?: string; // opcional: só vem se o usuário quiser trocar a senha
}

// Tudo que o app sabe pedir ao servidor. Tanto a API real quanto a API
// falsa (mock) precisam cumprir este contrato; por isso trocar uma pela
// outra não exige mexer em nenhuma tela.
export interface Api {
  login(email: string, senha: string): Promise<RespostaAuth>;
  cadastrar(nome: string, email: string, senha: string): Promise<RespostaAuth>;
  atualizarPerfil(dados: DadosPerfil): Promise<Usuario>;
  buscarReceita(ingredientes: string[], estilo?: string): Promise<Receita>;
  listarReceitas(): Promise<Receita[]>;
  definirFavorito(id: number, favorito: boolean): Promise<Receita>;
}
