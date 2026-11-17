// src/routes/ping.js
//
// Uma "rota de saúde": serve para confirmar que o servidor está de pé
// e que o banco de dados responde. Muito usada em projetos reais.
//
// Separamos as rotas em arquivos próprios (em vez de colocar tudo no
// index.js) para o projeto continuar organizado quando crescer.

import { Router } from "express";
import db from "../database.js";

// Router() cria um "mini-app" de rotas, que depois é plugado no app principal.
const router = Router();

// GET /ping
router.get("/", (req, res) => {
  // db.prepare(...).get() devolve UMA linha (ou undefined).
  // "SELECT 1" é a menor consulta possível: só testa se o banco responde.
  const teste = db.prepare("SELECT 1 AS ok").get();

  res.json({
    mensagem: "pong 🍳",
    servidor: "ok",
    banco: teste.ok === 1 ? "ok" : "com problema",
  });
});

export default router;
