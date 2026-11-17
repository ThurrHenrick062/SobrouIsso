// src/index.js
//
// Ponto de entrada do servidor. É este arquivo que "liga" tudo:
// carrega as variáveis do .env, cria o app Express, registra os
// middlewares e as rotas, e começa a escutar uma porta.

// "dotenv/config" lê o arquivo .env e coloca os valores em process.env.
// Precisa vir ANTES de qualquer código que use process.env.
import "dotenv/config";

import cors from "cors";
import express from "express";

// Importar o database.js já abre o banco e cria as tabelas (se faltarem).
import "./database.js";
import authRoutes from "./routes/auth.js";
import pingRoutes from "./routes/ping.js";
import { criarRotasReceitas } from "./routes/receitas.js";
import usuariosRoutes from "./routes/usuarios.js";
import { gerarReceita } from "./services/gemini.js";

// Sem o segredo, não dá para assinar nem conferir tokens de login.
// Melhor parar agora com uma mensagem clara do que falhar no meio do uso.
if (!process.env.JWT_SECRET) {
  console.error("\nERRO: a variável JWT_SECRET não está definida.");
  console.error("1) Copie o arquivo .env.example para .env");
  console.error("2) Preencha JWT_SECRET com um texto longo e aleatório.\n");
  process.exit(1);
}
if (process.env.JWT_SECRET.startsWith("troque-por")) {
  console.warn("AVISO: você ainda está usando o JWT_SECRET de exemplo. Troque-o no arquivo .env.");
}

// Sem a chave, o servidor liga normalmente (login e cadastro funcionam), mas
// buscar receitas devolve um aviso. Por isso é só um aviso, não um erro fatal.
if (!process.env.GEMINI_API_KEY) {
  console.warn("AVISO: GEMINI_API_KEY não está definida. A busca de receitas com IA não vai funcionar.");
  console.warn("       Crie uma chave grátis em https://aistudio.google.com/apikey e coloque no arquivo .env\n");
} else {
  console.log(`IA: modelo ${process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"}`);
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Middleware é uma função que roda ANTES das rotas, em toda requisição.

// cors: permite que o app no celular (outra "origem") acesse este servidor.
app.use(cors());

// express.json: transforma o corpo (body) JSON da requisição em objeto
// JavaScript, disponível em req.body.
app.use(express.json());

// --- Rotas ---
app.use("/ping", pingRoutes);
app.use("/auth", authRoutes); // POST /auth/cadastro e POST /auth/login
app.use("/usuarios", usuariosRoutes); // GET/PUT /usuarios/me (exigem token)

// Receitas: busca com IA, histórico e favoritos (exigem token).
app.use("/receitas", criarRotasReceitas({ gerarReceita }));

// Rota que não existe: responde em JSON (o app sempre espera { erro: "..." }).
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Qualquer erro não tratado (ex.: JSON malformado no corpo) cai aqui.
// O Express reconhece um "tratador de erros" pelos 4 parâmetros.
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  const status = erro.status ?? 500;
  if (status >= 500) console.error(erro);
  res.status(status).json({ erro: status === 400 ? "Requisição inválida." : "Erro interno do servidor." });
});

// --- Iniciar o servidor ---
// "0.0.0.0" faz o servidor aceitar conexões da rede local, e não só do
// próprio computador. Necessário para o celular conseguir acessá-lo.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Teste: http://localhost:${PORT}/ping`);
});
