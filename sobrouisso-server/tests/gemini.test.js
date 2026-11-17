// tests/gemini.test.js
// Testa o serviço da IA SEM chamar a Google de verdade: trocamos o "fetch"
// por uma versão falsa que guarda o pedido e devolve respostas que nós mesmos
// escrevemos. Assim conferimos (1) o que o servidor ENVIA e (2) como ele reage
// a respostas boas, ruins e a erros.
//
// Rodar: npm test

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

process.env.GEMINI_API_KEY = "chave-falsa-de-teste";
process.env.GEMINI_MODEL = "modelo-de-teste";

const { ErroIA, gerarReceita, montarPedido, normalizarReceita } = await import("../src/services/gemini.js");

const fetchOriginal = globalThis.fetch;
let pedidos; // pedidos que o SDK tentou fazer
let proximaResposta; // o que o "Gemini falso" vai responder

function respostaDoGemini(texto) {
  return { candidates: [{ content: { role: "model", parts: [{ text: texto }] }, finishReason: "STOP" }] };
}

const receitaBoa = {
  receitaPossivel: true,
  titulo: "Arroz mexido com ovos",
  descricao: "Rápido e aproveita as sobras.",
  tempoPreparo: "15 min",
  dificuldade: "Muito fácil",
  ingredientes: ["2 xícaras de arroz cozido", "2 ovos", "1 tomate", "Sal a gosto"],
  modoPreparo: ["1. Refogue o tomate.", "2) Junte os ovos e mexa.", "Misture o arroz e sirva."],
};

beforeEach(() => {
  pedidos = [];
  proximaResposta = { status: 200, corpo: respostaDoGemini(JSON.stringify(receitaBoa)) };
  globalThis.fetch = async (url, init) => {
    pedidos.push({ url: String(url), init });
    return new Response(JSON.stringify(proximaResposta.corpo), {
      status: proximaResposta.status,
      headers: { "content-type": "application/json" },
    });
  };
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

function erroDoGemini(status, mensagem, statusTexto) {
  proximaResposta = { status, corpo: { error: { code: status, message: mensagem, status: statusTexto } } };
}

describe("o que enviamos para a IA", () => {
  test("usa o modelo e a chave configurados e pede JSON no formato do esquema", async () => {
    await gerarReceita({ ingredientes: ["ovo", "arroz"] });

    assert.equal(pedidos.length, 1);
    const [{ url, init }] = pedidos;
    assert.match(url, /models\/modelo-de-teste:generateContent/);
    assert.equal(new Headers(init.headers).get("x-goog-api-key"), "chave-falsa-de-teste");

    const corpo = JSON.parse(init.body);
    const config = corpo.generationConfig;
    assert.equal(config.responseMimeType, "application/json");
    assert.ok(config.responseJsonSchema ?? config.responseSchema, "o esquema precisa ser enviado");
    assert.ok(corpo.systemInstruction, "as instruções do chef precisam ser enviadas");
  });

  test("coloca os ingredientes dentro da tag <ingredientes>", async () => {
    await gerarReceita({ ingredientes: ["ovo", "arroz"] });
    const texto = JSON.parse(pedidos[0].init.body).contents[0].parts[0].text;
    assert.match(texto, /<ingredientes>\n- ovo\n- arroz\n<\/ingredientes>/);
  });

  test("pede uma receita DIFERENTE quando há receitas anteriores", () => {
    const pedido = montarPedido(["ovo"], ["Omelete simples", 'Ovo "frito"']);
    assert.match(pedido, /Omelete simples/);
    assert.match(pedido, /DIFERENTE/);
    assert.doesNotMatch(pedido, /"frito"/, "aspas dentro do título são removidas");
  });

  test("sem receitas anteriores não menciona repetição", () => {
    assert.doesNotMatch(montarPedido(["ovo"], []), /DIFERENTE/);
  });
});

describe("a resposta da IA", () => {
  test("devolve a receita limpa (sem numeração nos passos)", async () => {
    const receita = await gerarReceita({ ingredientes: ["ovo"] });
    assert.equal(receita.titulo, "Arroz mexido com ovos");
    assert.equal(receita.dificuldade, "Muito fácil");
    assert.deepEqual(receita.modoPreparo, ["Refogue o tomate.", "Junte os ovos e mexa.", "Misture o arroz e sirva."]);
    assert.equal(receita.receitaPossivel, undefined, "campos internos não vazam para o app");
  });

  test("aceita JSON dentro de cercas de código", async () => {
    proximaResposta.corpo = respostaDoGemini("```json\n" + JSON.stringify(receitaBoa) + "\n```");
    assert.equal((await gerarReceita({ ingredientes: ["ovo"] })).titulo, "Arroz mexido com ovos");
  });

  test("dificuldade fora da lista vira 'Fácil'", () => {
    assert.equal(normalizarReceita({ ...receitaBoa, dificuldade: "Impossível" }).dificuldade, "Fácil");
  });

  test("receitaPossivel = false vira erro 422", async () => {
    proximaResposta.corpo = respostaDoGemini(JSON.stringify({ ...receitaBoa, receitaPossivel: false }));
    await assert.rejects(
      () => gerarReceita({ ingredientes: ["pedra"] }),
      (erro) => erro instanceof ErroIA && erro.status === 422
    );
  });

  test("receita incompleta vira erro 502", () => {
    assert.throws(
      () => normalizarReceita({ ...receitaBoa, modoPreparo: [] }),
      (erro) => erro instanceof ErroIA && erro.status === 502
    );
  });

  test("resposta que não é JSON vira erro 502", async () => {
    proximaResposta.corpo = respostaDoGemini("Claro! Aqui vai uma receita deliciosa...");
    await assert.rejects(
      () => gerarReceita({ ingredientes: ["ovo"] }),
      (erro) => erro instanceof ErroIA && erro.status === 502
    );
  });

  test("resposta bloqueada (sem texto) vira erro 422", async () => {
    proximaResposta.corpo = { candidates: [{ finishReason: "SAFETY" }] };
    await assert.rejects(
      () => gerarReceita({ ingredientes: ["ovo"] }),
      (erro) => erro instanceof ErroIA && erro.status === 422 && /SAFETY/.test(erro.detalhe)
    );
  });
});

describe("erros da Google viram mensagens simples", () => {
  const casos = [
    [429, "Resource exhausted", "RESOURCE_EXHAUSTED", 429, /muitos pedidos/, /429/],
    [403, "Permission denied", "PERMISSION_DENIED", 503, /indisponível/, /GEMINI_API_KEY/],
    [400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT", 503, /indisponível/, /GEMINI_API_KEY/],
    [404, "models/modelo-de-teste is not found", "NOT_FOUND", 503, /indisponível/, /GEMINI_MODEL/],
    [503, "The model is overloaded", "UNAVAILABLE", 503, /sobrecarregada/, /503/],
  ];

  for (const [status, mensagem, statusTexto, esperado, msgUsuario, msgDetalhe] of casos) {
    test(`HTTP ${status} -> ${esperado}`, async () => {
      erroDoGemini(status, mensagem, statusTexto);
      await assert.rejects(
        () => gerarReceita({ ingredientes: ["ovo"] }),
        (erro) => {
          assert.ok(erro instanceof ErroIA);
          assert.equal(erro.status, esperado);
          assert.match(erro.mensagemUsuario, msgUsuario);
          assert.match(erro.detalhe, msgDetalhe);
          // O usuário NUNCA vê detalhes de configuração:
          assert.doesNotMatch(erro.mensagemUsuario, /GEMINI|\.env|chave/i);
          return true;
        }
      );
    });
  }

  test("falha de rede vira erro 502", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    await assert.rejects(
      () => gerarReceita({ ingredientes: ["ovo"] }),
      (erro) => erro instanceof ErroIA && erro.status === 502
    );
  });
});

describe("configuração", () => {
  test("sem GEMINI_API_KEY não chama a Google e avisa que falta configurar", async () => {
    const chave = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await assert.rejects(
        () => gerarReceita({ ingredientes: ["ovo"] }),
        (erro) => erro instanceof ErroIA && erro.status === 503 && /GEMINI_API_KEY/.test(erro.detalhe)
      );
      assert.equal(pedidos.length, 0);
    } finally {
      process.env.GEMINI_API_KEY = chave;
    }
  });
});
