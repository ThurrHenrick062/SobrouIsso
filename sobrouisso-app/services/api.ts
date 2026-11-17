// services/api.ts
// ÚNICO lugar do app que sabe falar com o servidor. As telas nunca chamam
// fetch diretamente: elas chamam "api.login(...)", "api.buscarReceita(...)".
// Se o endereço ou o formato mudar, você corrige em um arquivo só.

import { API_URL, USAR_MOCK_AUTH, USAR_MOCK_RECEITAS } from "@/constants/config";
import type { Api, Receita, RespostaAuth, Usuario } from "@/types";
import { apiMock } from "./mock";
import { avisarSessaoExpirada, obterToken } from "./sessao";

// O AuthContext importa daqui; reexportamos para manter esse caminho.
export { definirToken } from "./sessao";

// Transforma qualquer erro em uma mensagem amigável para mostrar na tela.
export function mensagemDeErro(erro: unknown, padrao = "Algo deu errado. Tente novamente.") {
  return erro instanceof Error ? erro.message : padrao;
}

// Função genérica que faz a chamada HTTP. O <T> diz qual formato de dado
// esperamos receber de volta.
async function requisicao<T>(
  metodo: "GET" | "POST" | "PUT" | "PATCH",
  caminho: string,
  corpo?: unknown,
  tempoLimiteMs = 15_000
): Promise<T> {
  const token = obterToken();
  let resposta: Response;

  // Sem tempo limite, um servidor inalcançável (IP errado, Wi-Fi diferente)
  // deixaria o app esperando "para sempre". O AbortController cancela o pedido.
  const controle = new AbortController();
  const cronometro = setTimeout(() => controle.abort(), tempoLimiteMs);

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      signal: controle.signal,
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        // Só envia o crachá se já estivermos logados.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // fetch só lança erro quando nem chegou ao servidor (sem rede, IP errado...)
    // ou quando o tempo limite estourou.
    throw new Error(
      controle.signal.aborted
        ? "O servidor não respondeu a tempo. Confira se ele está rodando e se o endereço em constants/config.ts está certo."
        : "Não foi possível conectar ao servidor. Confira se ele está rodando e se o endereço em constants/config.ts está certo."
    );
  } finally {
    clearTimeout(cronometro);
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // 401 COM token = o servidor não aceita mais a nossa sessão: desloga.
    // (Um 401 no login acontece SEM token, então não cai aqui.)
    if (resposta.status === 401 && token) avisarSessaoExpirada();

    // Combinamos que o servidor responde erros assim: { "erro": "mensagem" }
    throw new Error(dados?.erro ?? "Algo deu errado. Tente novamente.");
  }

  return dados as T;
}

const apiReal: Api = {
  login: (email, senha) => requisicao<RespostaAuth>("POST", "/auth/login", { email, senha }),

  cadastrar: (nome, email, senha) =>
    requisicao<RespostaAuth>("POST", "/auth/cadastro", { nome, email, senha }),

  atualizarPerfil: (dados) => requisicao<Usuario>("PUT", "/usuarios/me", dados),

  // A IA leva alguns segundos para criar a receita: damos até 60s (o servidor
  // desiste sozinho aos 45s e responde com um aviso).
  buscarReceita: (ingredientes, estilo) =>
    requisicao<Receita>("POST", "/receitas/buscar", { ingredientes, estilo }, 60_000),

  listarReceitas: () => requisicao<Receita[]>("GET", "/receitas"),

  definirFavorito: (id, favorito) =>
    requisicao<Receita>("PATCH", `/receitas/${id}/favorito`, { favorito }),
};

// O app inteiro usa este "api". Cada grupo de funções vem do servidor real
// ou do mock, conforme as chaves em constants/config.ts.
const auth = USAR_MOCK_AUTH ? apiMock : apiReal;
const receitas = USAR_MOCK_RECEITAS ? apiMock : apiReal;

export const api: Api = {
  login: auth.login,
  cadastrar: auth.cadastrar,
  atualizarPerfil: auth.atualizarPerfil,
  buscarReceita: receitas.buscarReceita,
  listarReceitas: receitas.listarReceitas,
  definirFavorito: receitas.definirFavorito,
};
