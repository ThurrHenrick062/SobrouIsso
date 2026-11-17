// src/database.js
//
// Este arquivo tem UM trabalho: abrir (ou criar, se não existir) o arquivo
// do banco SQLite e garantir que as tabelas necessárias existam.
//
// Todos os outros arquivos do backend vão importar o "db" exportado aqui
// para fazer suas queries. Centralizar evita abrir o arquivo várias vezes.

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// Em ES Modules, "__dirname" não existe pronto como no CommonJS.
// Recriamos a partir de "import.meta.url" (a URL deste arquivo).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// path.join monta o caminho de forma segura em qualquer sistema operacional.
// O banco fica na raiz do servidor: sobrouisso-server/sobrouisso.db
// DB_PATH existe para os testes automáticos usarem um banco em memória
// (":memory:") sem encostar nos seus dados. No uso normal, fica o arquivo padrão.
const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "sobrouisso.db");

// Se "sobrouisso.db" não existir, o better-sqlite3 CRIA o arquivo.
// Se já existir, apenas abre.
const db = new Database(dbPath);

// PRAGMA é uma configuração específica do SQLite.
// "foreign_keys = ON" faz o SQLite respeitar as relações entre tabelas
// (ex: não permitir uma receita com usuario_id que não existe).
// Por padrão isso vem DESLIGADO.
db.pragma("foreign_keys = ON");

// --- Criação das tabelas ---
//
// "CREATE TABLE IF NOT EXISTS" permite rodar este arquivo quantas vezes
// quiser: nunca apaga dados nem dá erro de tabela duplicada.
//
// exec() roda SQL "de estrutura" (CREATE, DROP, ALTER...), sem esperar linhas.

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    tema TEXT NOT NULL DEFAULT 'claro',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS receitas_geradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    ingredientes_busca TEXT NOT NULL,
    receita_json TEXT NOT NULL,
    favorito INTEGER NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  );
`);

// Exporta o "db" para outros arquivos: import db from "./database.js";
export default db;

// --- Bloco de teste manual ---
//
// Só roda quando você executa ESTE arquivo diretamente
// (npm run db:init), e não quando outro arquivo o importa.
// Em CommonJS era "require.main === module"; em ES Modules comparamos
// o arquivo que o Node está executando (process.argv[1]) com este arquivo.
const rodandoDiretamente = process.argv[1] === __filename;

if (rodandoDiretamente) {
  console.log("Banco criado/aberto em:", dbPath);

  // sqlite_master é uma tabela especial do SQLite com metadados
  // sobre todas as tabelas existentes.
  const tabelas = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all();

  console.log(
    "Tabelas existentes:",
    tabelas.map((t) => t.name)
  );
}
