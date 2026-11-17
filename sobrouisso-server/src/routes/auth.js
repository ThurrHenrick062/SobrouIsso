// src/routes/auth.js
// Cadastro e login.
//
// Como a segurança funciona aqui:
//  - A senha NUNCA é guardada. Guardamos só o "hash" (uma impressão digital
//    irreversível, gerada pelo bcrypt). No login, comparamos o hash da senha
//    digitada com o hash salvo.
//  - Depois de entrar, o servidor entrega um TOKEN (JWT). O app o guarda e
//    o envia nas próximas requisições para provar quem é.

import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import db from "../database.js";
import { emailValido, nomeValido, normalizarEmail, problemaNaSenha } from "../utils/validacao.js";

const router = Router();

// "Custo" do bcrypt: quanto maior, mais lento (e mais difícil de quebrar).
// 10 é o padrão recomendado para apps comuns.
const CUSTO_BCRYPT = 10;

// Hash de mentira, usado quando o e-mail não existe. Assim o login demora o
// mesmo tempo com e-mail certo ou errado, e ninguém descobre quais e-mails
// estão cadastrados medindo o tempo de resposta.
const HASH_FALSO = bcrypt.hashSync("senha-que-nao-existe", CUSTO_BCRYPT);

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// O que enviamos ao app. Repare que a senha_hash NUNCA sai do servidor.
function dadosPublicos(linha) {
  return { id: linha.id, nome: linha.nome, email: linha.email, tema: linha.tema };
}

// POST /auth/cadastro  { nome, email, senha }
router.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body ?? {};

    if (!nomeValido(nome)) {
      return res.status(400).json({ erro: "Informe o seu nome." });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ erro: "Digite um e-mail válido." });
    }
    const problema = problemaNaSenha(senha);
    if (problema) {
      return res.status(400).json({ erro: problema });
    }

    const emailNormalizado = normalizarEmail(email);

    const jaExiste = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(emailNormalizado);
    if (jaExiste) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }

    // bcrypt.hash é assíncrono porque é um cálculo lento de propósito.
    const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT);

    // Os "?" são preenchidos pelo SQLite de forma segura (evita SQL injection).
    const resultado = db
      .prepare("INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)")
      .run(nome.trim(), emailNormalizado, senhaHash);

    const usuario = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(resultado.lastInsertRowid);

    return res.status(201).json({ token: gerarToken(usuario), usuario: dadosPublicos(usuario) });
  } catch (erro) {
    // Duas pessoas cadastrando o mesmo e-mail ao mesmo tempo: o UNIQUE do
    // banco é a última barreira.
    if (erro?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    console.error("Erro no cadastro:", erro);
    return res.status(500).json({ erro: "Não foi possível criar a conta. Tente novamente." });
  }
});

// POST /auth/login  { email, senha }
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};

    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
      return res.status(400).json({ erro: "Preencha e-mail e senha." });
    }

    const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(normalizarEmail(email));

    // Sempre rodamos a comparação, mesmo sem usuário (veja HASH_FALSO acima).
    const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);

    // Mesma mensagem para "e-mail não existe" e "senha errada": não revelamos
    // quais e-mails têm conta.
    if (!usuario || !senhaConfere) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos." });
    }

    return res.json({ token: gerarToken(usuario), usuario: dadosPublicos(usuario) });
  } catch (erro) {
    console.error("Erro no login:", erro);
    return res.status(500).json({ erro: "Não foi possível entrar. Tente novamente." });
  }
});

export default router;
