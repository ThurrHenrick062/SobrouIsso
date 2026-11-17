// src/routes/receitas.js
// A funcionalidade principal do app: gerar receitas com IA e guardar o histórico.
//
// Todas as rotas exigem login (middleware "autenticar") e cada usuário só
// enxerga as PRÓPRIAS receitas.
//
// Repare que a função da IA chega por parâmetro (criarRotasReceitas recebe
// "gerarReceita"). Isso se chama injeção de dependência: nos testes
// entregamos uma IA de mentira e a rota funciona igual, sem gastar a cota.

import { Router } from "express";
import db from "../database.js";
import { autenticar } from "../middlewares/autenticar.js";
import { ErroIA } from "../services/gemini.js";
import { criarLimitador } from "../utils/limitador.js";
import { limparIngredientes } from "../utils/validacao.js";

// Converte uma linha do banco no formato que o app espera (types/index.ts).
function paraReceita(linha) {
  const dados = JSON.parse(linha.receita_json);
  return {
    id: linha.id,
    titulo: dados.titulo,
    descricao: dados.descricao,
    tempoPreparo: dados.tempoPreparo,
    dificuldade: dados.dificuldade,
    ingredientes: dados.ingredientes,
    modoPreparo: dados.modoPreparo,
    ingredientesBusca: JSON.parse(linha.ingredientes_busca),
    favorito: linha.favorito === 1, // o SQLite guarda booleano como 0 ou 1
    // O SQLite devolve "2026-11-16 18:30:00" (UTC, sem fuso). Convertemos para ISO.
    criadoEm: new Date(`${linha.criado_em.replace(" ", "T")}Z`).toISOString(),
  };
}

export function criarRotasReceitas({
  gerarReceita,
  limitePorUsuario = 5, // buscas por minuto de cada pessoa
  limiteGeral = 9, // buscas por minuto de todos juntos (a cota gratuita é pequena)
}) {
  const router = Router();
  router.use(autenticar);

  const limitadorUsuario = criarLimitador(limitePorUsuario, 60_000);
  const limitadorGeral = criarLimitador(limiteGeral, 60_000);

  // POST /receitas/buscar  { ingredientes: string[] }
  // POST /receitas/buscar  { ingredientes: string[] }
  router.post("/buscar", async (req, res) => {
    try {
      const { ingredientes, erro } = limparIngredientes(req.body?.ingredientes);
      const estilo = req.body?.estilo || "Normal"; // <-- ADICIONE ESTA LINHA AQUI
      if (erro) return res.status(400).json({ erro });

      // Protege a cota da IA (só contamos pedidos que realmente chegam nela).
      const doUsuario = limitadorUsuario.tentar(String(req.usuarioId));
      if (!doUsuario.permitido) {
        return res.status(429).json({
          erro: `Você fez muitas buscas seguidas. Aguarde ${doUsuario.esperarSegundos}s e tente de novo.`,
        });
      }
      const geral = limitadorGeral.tentar();
      if (!geral.permitido) {
        return res.status(429).json({
          erro: `O chef está ocupado com outros pedidos. Tente de novo em ${geral.esperarSegundos}s.`,
        });
      }

      // Para "Ver outras sugestões" não repetir a mesma receita, avisamos a IA
      // dos títulos que ela já criou para ESTA mesma lista de ingredientes.
      const chaveBusca = JSON.stringify(ingredientes);
      const anteriores = db
        .prepare(
          "SELECT receita_json FROM receitas_geradas WHERE usuario_id = ? AND ingredientes_busca = ? ORDER BY id DESC LIMIT 5"
        )
        .all(req.usuarioId, chaveBusca);
      const evitar = anteriores.map((linha) => JSON.parse(linha.receita_json).titulo);

      const receita = await gerarReceita({ ingredientes, evitar, estilo });

      const resultado = db
        .prepare("INSERT INTO receitas_geradas (usuario_id, ingredientes_busca, receita_json) VALUES (?, ?, ?)")
        .run(req.usuarioId, chaveBusca, JSON.stringify(receita));

      const linha = db.prepare("SELECT * FROM receitas_geradas WHERE id = ?").get(resultado.lastInsertRowid);
      return res.status(201).json(paraReceita(linha));
    } catch (erro) {
      if (erro instanceof ErroIA) {
        // O detalhe técnico fica só no terminal; o usuário recebe a mensagem simples.
        if (erro.detalhe) console.error(`[IA] ${erro.detalhe}`);
        return res.status(erro.status).json({ erro: erro.mensagemUsuario });
      }
      console.error("Erro ao buscar receita:", erro);
      return res.status(500).json({ erro: "Não foi possível buscar a receita. Tente novamente." });
    }
  });

  // GET /receitas  -> histórico do usuário, da mais nova para a mais antiga
  router.get("/", (req, res) => {
    const linhas = db
      .prepare("SELECT * FROM receitas_geradas WHERE usuario_id = ? ORDER BY id DESC LIMIT 100")
      .all(req.usuarioId);
    return res.json(linhas.map(paraReceita));
  });

  // PATCH /receitas/:id/favorito  { favorito: boolean }
  router.patch("/:id/favorito", (req, res) => {
    const id = Number(req.params.id);
    const { favorito } = req.body ?? {};

    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({ erro: "Receita não encontrada." });
    }
    if (typeof favorito !== "boolean") {
      return res.status(400).json({ erro: "Informe se a receita é favorita (true ou false)." });
    }

    // "AND usuario_id = ?" é o que impede alguém de mexer na receita de outra pessoa.
    const resultado = db
      .prepare("UPDATE receitas_geradas SET favorito = ? WHERE id = ? AND usuario_id = ?")
      .run(favorito ? 1 : 0, id, req.usuarioId);

    if (resultado.changes === 0) {
      return res.status(404).json({ erro: "Receita não encontrada." });
    }

    const linha = db.prepare("SELECT * FROM receitas_geradas WHERE id = ?").get(id);
    return res.json(paraReceita(linha));
  });

  return router;
}
