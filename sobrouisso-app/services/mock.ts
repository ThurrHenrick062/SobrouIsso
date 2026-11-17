// services/mock.ts
// Servidor FALSO que roda dentro do próprio app, para você desenvolver as
// telas sem depender do backend. Os dados ficam só na memória: ao fechar
// o app, tudo some (contas e receitas), o que é esperado em um mock.
//
// Mesmo sendo falso, ele segue as MESMAS regras do servidor real: não deixa
// cadastrar e-mail repetido e só aceita login de conta já cadastrada.

import type { Api, Receita, Usuario } from "@/types";
import { obterToken } from "./sessao";

// Simula o tempo de resposta de uma rede/IA.
const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface ContaMock extends Usuario {
  senha: string; // no mock a senha fica em texto puro; o servidor real guarda só o hash
}

let contas: ContaMock[] = [];
let proximoIdConta = 1;
let contaAtualId: number | null = null;

// As receitas ficam separadas por sessão (pelo token), para um usuário
// nunca ver as receitas de outro.
const receitasPorSessao = new Map<string, Receita[]>();
let proximoIdReceita = 1;

function minhasReceitas(): Receita[] {
  return receitasPorSessao.get(obterToken() ?? "") ?? [];
}

function guardarReceitas(lista: Receita[]) {
  receitasPorSessao.set(obterToken() ?? "", lista);
}

// O que o app pode ver da conta (sem a senha).
function publico(conta: ContaMock): Usuario {
  return { id: conta.id, nome: conta.nome, email: conta.email, tema: conta.tema };
}

function emailEmUso(email: string, ignorarId?: number) {
  return contas.some((c) => c.email === email && c.id !== ignorarId);
}

export const apiMock: Api = {
  async login(email, senha) {
    await esperar(400);
    const conta = contas.find((c) => c.email === email.trim().toLowerCase());
    // Mesma mensagem para e-mail inexistente e senha errada, como no servidor.
    if (!conta || conta.senha !== senha) throw new Error("E-mail ou senha incorretos.");
    contaAtualId = conta.id;
    return { token: `mock-${conta.id}`, usuario: publico(conta) };
  },

  async cadastrar(nome, email, senha) {
    await esperar(400);
    const emailNormalizado = email.trim().toLowerCase();
    if (emailEmUso(emailNormalizado)) throw new Error("Este e-mail já está cadastrado.");

    const conta: ContaMock = {
      id: proximoIdConta++,
      nome: nome.trim(),
      email: emailNormalizado,
      senha,
      tema: "claro",
    };
    contas = [...contas, conta];
    contaAtualId = conta.id;
    return { token: `mock-${conta.id}`, usuario: publico(conta) };
  },

  async atualizarPerfil(dados) {
    await esperar(300);
    const conta = contas.find((c) => c.id === contaAtualId);
    if (!conta) throw new Error("Sua sessão expirou. Entre novamente.");

    const emailNormalizado = dados.email.trim().toLowerCase();
    if (emailEmUso(emailNormalizado, conta.id)) throw new Error("Este e-mail já está cadastrado.");

    const atualizada: ContaMock = {
      ...conta,
      nome: dados.nome.trim(),
      email: emailNormalizado,
      senha: dados.senha || conta.senha, // vazio = mantém a senha atual
    };
    contas = contas.map((c) => (c.id === conta.id ? atualizada : c));
    return publico(atualizada);
  },

  async buscarReceita(ingredientes, estilo) {
    await esperar(1500); // a IA real também demora alguns segundos

    const nova: Receita = {
      id: proximoIdReceita++,
      titulo: `Refogado de ${ingredientes[0]}`,
      descricao: "Uma receita simples e rápida, feita só com o que você já tem em casa.",
      tempoPreparo: "20 min",
      dificuldade: "Muito fácil",
      ingredientes: [
        ...ingredientes.map((item) => `${item} (quanto baste)`),
        "1 colher de sopa de óleo",
        "Sal a gosto",
      ],
      modoPreparo: [
        "Lave e pique todos os ingredientes em pedaços pequenos.",
        "Aqueça o óleo em uma panela em fogo médio.",
        "Adicione os ingredientes, começando pelos que demoram mais a cozinhar.",
        "Tempere com sal e mexa de vez em quando por cerca de 10 minutos.",
        "Prove, ajuste o tempero e sirva quente.",
      ],
      ingredientesBusca: ingredientes,
      favorito: false,
      criadoEm: new Date().toISOString(),
    };

    guardarReceitas([nova, ...minhasReceitas()]); // a mais nova vai para o começo
    return nova;
  },

  async listarReceitas() {
    await esperar(300);
    return minhasReceitas();
  },

  async definirFavorito(id, favorito) {
    await esperar(150);
    const existente = minhasReceitas().find((r) => r.id === id);
    if (!existente) throw new Error("Receita não encontrada.");
    const atualizada = { ...existente, favorito };
    guardarReceitas(minhasReceitas().map((r) => (r.id === id ? atualizada : r)));
    return atualizada;
  },
};
