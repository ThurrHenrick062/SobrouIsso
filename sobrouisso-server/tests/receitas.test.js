// tests/receitas.test.js
// Testa as rotas /receitas com uma IA FALSA (injeção de dependência) e um
// banco de dados em memória: não gasta a cota do Gemini e não mexe nos seus
// dados reais.
//
// Rodar: npm test

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

// Estas variáveis precisam existir ANTES de importar o resto (por isso os
// "await import" abaixo, em vez de import no topo).
process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "segredo-de-teste";

const { default: express } = await import("express");
const { default: authRoutes } = await import("../src/routes/auth.js");
const { criarRotasReceitas } = await import("../src/routes/receitas.js");
const { ErroIA } = await import("../src/services/gemini.js");

// --- A IA falsa: guarda o que recebeu e devolve uma receita fixa ---------
let chamadas = [];
let comportamento = null; // se definido, substitui a resposta (para simular erros)
let contador = 0;

async function iaFalsa({ ingredientes, evitar }) {
  chamadas.push({ ingredientes, evitar });
  if (comportamento) return comportamento();
  contador += 1;
  return {
    titulo: `Receita ${contador}`,
    descricao: "Descrição de teste.",
    tempoPreparo: "10 min",
    dificuldade: "Fácil",
    ingredientes: [...ingredientes.map((i) => `1 ${i}`), "Sal a gosto"],
    modoPreparo: ["Passo um.", "Passo dois."],
  };
}

function subirServidor(opcoesDaRota) {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);
  app.use("/receitas", criarRotasReceitas({ gerarReceita: iaFalsa, ...opcoesDaRota }));
  return new Promise((resolve) => {
    const servidor = app.listen(0, "127.0.0.1", () =>
      resolve({ servidor, base: `http://127.0.0.1:${servidor.address().port}` })
    );
  });
}

let servidor;
let base;
let n = 0;

// Cria uma conta nova e devolve o token.
async function novoUsuario() {
  n += 1;
  const r = await fetch(`${base}/auth/cadastro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: `Pessoa ${n}`, email: `pessoa${n}@teste.com`, senha: "123456" }),
  });
  return (await r.json()).token;
}

async function chamar(metodo, caminho, token, corpo) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: resposta.status, dados: await resposta.json() };
}

before(async () => {
  ({ servidor, base } = await subirServidor({ limitePorUsuario: 1000, limiteGeral: 1000 }));
});
after(() => servidor.close());

describe("POST /receitas/buscar", () => {
  test("exige login", async () => {
    const { status } = await chamar("POST", "/receitas/buscar", null, { ingredientes: ["ovo"] });
    assert.equal(status, 401);
  });

  test("devolve a receita no formato do app", async () => {
    const token = await novoUsuario();
    const { status, dados } = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo", "arroz"] });

    assert.equal(status, 201);
    assert.equal(typeof dados.id, "number");
    assert.equal(dados.favorito, false);
    assert.deepEqual(dados.ingredientesBusca, ["ovo", "arroz"]);
    assert.deepEqual(dados.modoPreparo, ["Passo um.", "Passo dois."]);
    assert.ok(!Number.isNaN(Date.parse(dados.criadoEm)), "criadoEm precisa ser uma data ISO");
    assert.match(dados.criadoEm, /Z$/);
  });

  test("limpa e remove repetidos antes de chamar a IA", async () => {
    chamadas = [];
    const token = await novoUsuario();
    await chamar("POST", "/receitas/buscar", token, { ingredientes: ["Ovo", " ovo ", "to<mate>", "", "  "] });
    assert.deepEqual(chamadas[0].ingredientes, ["Ovo", "to mate"]);
  });

  const invalidos = [
    ["lista vazia", { ingredientes: [] }],
    ["só itens em branco", { ingredientes: ["", "   "] }],
    ["sem o campo", {}],
    ["não é lista", { ingredientes: "ovo" }],
    ["item que não é texto", { ingredientes: ["ovo", 5] }],
    ["item grande demais", { ingredientes: ["x".repeat(41)] }],
    ["ingredientes demais", { ingredientes: Array.from({ length: 21 }, (_, i) => `item${i}`) }],
  ];
  for (const [nome, corpo] of invalidos) {
    test(`recusa: ${nome} (400, sem chamar a IA)`, async () => {
      chamadas = [];
      const token = await novoUsuario();
      const { status, dados } = await chamar("POST", "/receitas/buscar", token, corpo);
      assert.equal(status, 400);
      assert.ok(dados.erro);
      assert.equal(chamadas.length, 0);
    });
  }

  test("tenta de novo com os mesmos ingredientes: pede uma receita diferente", async () => {
    const token = await novoUsuario();
    const primeira = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["batata"] });
    chamadas = [];
    await chamar("POST", "/receitas/buscar", token, { ingredientes: ["batata"] });
    assert.deepEqual(chamadas[0].evitar, [primeira.dados.titulo]);
  });

  test("ingredientes diferentes não herdam o 'evitar' de outra busca", async () => {
    const token = await novoUsuario();
    await chamar("POST", "/receitas/buscar", token, { ingredientes: ["cenoura"] });
    chamadas = [];
    await chamar("POST", "/receitas/buscar", token, { ingredientes: ["beterraba"] });
    assert.deepEqual(chamadas[0].evitar, []);
  });

  test("erro da IA chega ao app com a mensagem amigável e o status certo", async () => {
    const token = await novoUsuario();
    comportamento = () => {
      throw new ErroIA(429, "A IA está com muitos pedidos agora.", "cota");
    };
    const { status, dados } = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] });
    comportamento = null;
    assert.equal(status, 429);
    assert.equal(dados.erro, "A IA está com muitos pedidos agora.");
  });

  test("erro inesperado vira 500 sem vazar detalhes", async () => {
    const token = await novoUsuario();
    comportamento = () => {
      throw new Error("senha do banco: abc123");
    };
    const { status, dados } = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] });
    comportamento = null;
    assert.equal(status, 500);
    assert.doesNotMatch(dados.erro, /abc123/);
  });

  test("busca que falha não grava nada no histórico", async () => {
    const token = await novoUsuario();
    comportamento = () => {
      throw new ErroIA(502, "falhou", "x");
    };
    await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] });
    comportamento = null;
    const { dados } = await chamar("GET", "/receitas", token);
    assert.deepEqual(dados, []);
  });
});

describe("GET /receitas", () => {
  test("lista da mais nova para a mais antiga", async () => {
    const token = await novoUsuario();
    const a = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["a1"] });
    const b = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["b1"] });
    const { dados } = await chamar("GET", "/receitas", token);
    assert.deepEqual(dados.map((r) => r.id), [b.dados.id, a.dados.id]);
  });

  test("cada usuário vê só as próprias receitas", async () => {
    const ana = await novoUsuario();
    const beto = await novoUsuario();
    await chamar("POST", "/receitas/buscar", ana, { ingredientes: ["segredo-da-ana"] });
    const { dados } = await chamar("GET", "/receitas", beto);
    assert.deepEqual(dados, []);
  });

  test("exige login", async () => {
    assert.equal((await chamar("GET", "/receitas", null)).status, 401);
  });
});

describe("PATCH /receitas/:id/favorito", () => {
  test("favorita e desfavorita", async () => {
    const token = await novoUsuario();
    const { dados: receita } = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] });

    const ligado = await chamar("PATCH", `/receitas/${receita.id}/favorito`, token, { favorito: true });
    assert.equal(ligado.status, 200);
    assert.equal(ligado.dados.favorito, true);

    const lista = await chamar("GET", "/receitas", token);
    assert.equal(lista.dados[0].favorito, true);

    const desligado = await chamar("PATCH", `/receitas/${receita.id}/favorito`, token, { favorito: false });
    assert.equal(desligado.dados.favorito, false);
  });

  test("não deixa mexer na receita de outra pessoa (404)", async () => {
    const dono = await novoUsuario();
    const intruso = await novoUsuario();
    const { dados: receita } = await chamar("POST", "/receitas/buscar", dono, { ingredientes: ["ovo"] });

    const { status } = await chamar("PATCH", `/receitas/${receita.id}/favorito`, intruso, { favorito: true });
    assert.equal(status, 404);

    const { dados } = await chamar("GET", "/receitas", dono);
    assert.equal(dados[0].favorito, false, "a receita do dono não pode ter mudado");
  });

  test("valores inválidos", async () => {
    const token = await novoUsuario();
    const { dados: receita } = await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] });

    assert.equal((await chamar("PATCH", `/receitas/${receita.id}/favorito`, token, { favorito: "sim" })).status, 400);
    assert.equal((await chamar("PATCH", `/receitas/${receita.id}/favorito`, token, {})).status, 400);
    assert.equal((await chamar("PATCH", "/receitas/99999/favorito", token, { favorito: true })).status, 404);
    assert.equal((await chamar("PATCH", "/receitas/abc/favorito", token, { favorito: true })).status, 404);
  });
});

describe("limites de uso (proteção da cota da IA)", () => {
  test("limite por usuário: passou do máximo, recebe 429 e a IA não é chamada", async () => {
    const { servidor: s, base: b } = await subirServidor({ limitePorUsuario: 2, limiteGeral: 1000 });
    const baseOriginal = base;
    base = b;
    try {
      const token = await novoUsuario();
      chamadas = [];
      const respostas = [];
      for (let i = 0; i < 3; i++) {
        respostas.push(await chamar("POST", "/receitas/buscar", token, { ingredientes: [`item${i}`] }));
      }
      assert.deepEqual(respostas.map((r) => r.status), [201, 201, 429]);
      assert.match(respostas[2].dados.erro, /Aguarde \d+s/);
      assert.equal(chamadas.length, 2, "a terceira não pode chegar na IA");

      // Outro usuário não é afetado pelo limite do primeiro.
      const outro = await novoUsuario();
      assert.equal((await chamar("POST", "/receitas/buscar", outro, { ingredientes: ["x"] })).status, 201);
    } finally {
      base = baseOriginal;
      s.close();
    }
  });

  test("limite geral: protege a cota compartilhada por todos os usuários", async () => {
    const { servidor: s, base: b } = await subirServidor({ limitePorUsuario: 1000, limiteGeral: 2 });
    const baseOriginal = base;
    base = b;
    try {
      const u1 = await novoUsuario();
      const u2 = await novoUsuario();
      const u3 = await novoUsuario();
      const status = [];
      for (const token of [u1, u2, u3]) {
        status.push((await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] })).status);
      }
      assert.deepEqual(status, [201, 201, 429]);
    } finally {
      base = baseOriginal;
      s.close();
    }
  });

  test("buscas inválidas não gastam o limite", async () => {
    const { servidor: s, base: b } = await subirServidor({ limitePorUsuario: 1, limiteGeral: 1000 });
    const baseOriginal = base;
    base = b;
    try {
      const token = await novoUsuario();
      await chamar("POST", "/receitas/buscar", token, { ingredientes: [] }); // 400
      assert.equal((await chamar("POST", "/receitas/buscar", token, { ingredientes: ["ovo"] })).status, 201);
    } finally {
      base = baseOriginal;
      s.close();
    }
  });
});
