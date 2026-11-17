// src/routes/usuarios.js
// Dados do usuário logado (tela de Configurações do app).
// Todas as rotas daqui exigem token: o middleware "autenticar" roda primeiro.

import bcrypt from "bcryptjs";
import { Router } from "express";
import db from "../database.js";
import { autenticar } from "../middlewares/autenticar.js";
import { emailValido, nomeValido, normalizarEmail, problemaNaSenha } from "../utils/validacao.js";

const router = Router();
router.use(autenticar);

function dadosPublicos(linha) {
  return { id: linha.id, nome: linha.nome, email: linha.email, tema: linha.tema };
}

// GET /usuarios/me
router.get("/me", (req, res) => {
  const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuarioId);
  if (!usuario) {
    // O token é válido, mas a conta não existe mais (ex.: banco recriado).
    return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
  }
  return res.json(dadosPublicos(usuario));
});

// PUT /usuarios/me  { nome, email, senha? }
router.put("/me", async (req, res) => {
  try {
    const { nome, email, senha } = req.body ?? {};

    if (!nomeValido(nome)) return res.status(400).json({ erro: "Informe o seu nome." });
    if (!emailValido(email)) return res.status(400).json({ erro: "Digite um e-mail válido." });

    // A senha é opcional: só validamos e trocamos se ela vier preenchida.
    const quemTrocaSenha = typeof senha === "string" && senha.length > 0;
    if (quemTrocaSenha) {
      const problema = problemaNaSenha(senha);
      if (problema) return res.status(400).json({ erro: problema });
    }

    const atual = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuarioId);
    if (!atual) return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });

    const emailNormalizado = normalizarEmail(email);

    // O novo e-mail não pode pertencer a OUTRA pessoa.
    const dono = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(emailNormalizado);
    if (dono && dono.id !== req.usuarioId) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }

    if (quemTrocaSenha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      db.prepare("UPDATE usuarios SET nome = ?, email = ?, senha_hash = ? WHERE id = ?").run(
        nome.trim(),
        emailNormalizado,
        senhaHash,
        req.usuarioId
      );
    } else {
      db.prepare("UPDATE usuarios SET nome = ?, email = ? WHERE id = ?").run(
        nome.trim(),
        emailNormalizado,
        req.usuarioId
      );
    }

    const atualizado = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuarioId);
    return res.json(dadosPublicos(atualizado));
  } catch (erro) {
    if (erro?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    console.error("Erro ao atualizar usuário:", erro);
    return res.status(500).json({ erro: "Não foi possível salvar. Tente novamente." });
  }
});

export default router;
