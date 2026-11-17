# 🍳 SobrouIsso — Backend

Servidor do app SobrouIsso (projeto extensionista). Cuida das contas dos usuários, recebe a lista de ingredientes do app, pede uma receita à IA (Google Gemini) e guarda o histórico e os favoritos em um banco SQLite.

## Tecnologias

- **Node.js** (ES Modules) + **Express**
- **SQLite** via `better-sqlite3`
- **bcryptjs** (criptografia de senha) + **jsonwebtoken** (token de login)
- **Google Gemini API** via `@google/genai`

## Como rodar

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env        # no Windows: copy .env.example .env

# 3. Abrir o .env e preencher JWT_SECRET e GEMINI_API_KEY (veja abaixo)

# 4. Criar o banco de dados e as tabelas
npm run db:init

# 5. Iniciar o servidor (reinicia sozinho ao salvar arquivos)
npm run dev
```

> Windows: na primeira vez, o firewall pergunta se o Node.js pode acessar a rede. Permita em **rede privada**; sem isso o celular não consegue chegar ao servidor.

## Configurando o `.env`

| Variável | Para que serve | Obrigatória |
|---|---|---|
| `JWT_SECRET` | Assina os tokens de login. Sem ela o servidor não liga. | Sim |
| `GEMINI_API_KEY` | Chave da IA. Sem ela, o login funciona mas a busca de receitas devolve um aviso. | Para a IA |
| `GEMINI_MODEL` | Modelo usado. Padrão: `gemini-3.5-flash-lite` | Não |
| `PORT` | Porta do servidor. Padrão: `3000` | Não |

Para gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Criando a chave do Gemini (grátis)

1. Entre em <https://aistudio.google.com/apikey> com uma conta Google.
2. Clique em **Criar chave de API** (o plano gratuito não pede cartão).
3. Copie a chave para `GEMINI_API_KEY=` no `.env` (sem aspas e sem espaços).
4. Reinicie o servidor. Ao ligar, ele mostra `IA: modelo gemini-3.5-flash-lite`.

**Nunca** envie essa chave para o GitHub nem a compartilhe: o `.env` já está no `.gitignore`.

### Cuidados com o plano gratuito

- **Os limites são pequenos** (poucos pedidos por minuto e por dia, que variam por modelo e valem para o projeto inteiro). Veja os do seu projeto no [Google AI Studio](https://aistudio.google.com/). Por isso o servidor limita cada usuário a 5 buscas por minuto e todos juntos a 9 (ajuste em `src/routes/receitas.js`).
- **Modelos são desativados com frequência.** Se o terminal mostrar `O modelo "..." não foi encontrado`, veja os modelos atuais em <https://ai.google.dev/gemini-api/docs/models> e troque o `GEMINI_MODEL`.
- **Privacidade:** no plano gratuito, a Google pode usar o conteúdo enviado para melhorar seus produtos (confira os termos atuais no AI Studio). O servidor envia à IA **só a lista de ingredientes** (nunca nome, e-mail ou outro dado do usuário).

## Rotas

Erros sempre vêm como `{ "erro": "mensagem" }`. Rotas com token esperam `Authorization: Bearer <token>`.

| Método | Rota | Token | Corpo | Respostas |
|---|---|---|---|---|
| GET | `/ping` | não | — | `200` servidor e banco ok |
| POST | `/auth/cadastro` | não | `{ nome, email, senha }` | `201 { token, usuario }`, `400`, `409` e-mail já cadastrado |
| POST | `/auth/login` | não | `{ email, senha }` | `200 { token, usuario }`, `400`, `401` e-mail ou senha incorretos |
| GET | `/usuarios/me` | sim | — | `200 usuario`, `401` |
| PUT | `/usuarios/me` | sim | `{ nome, email, senha? }` | `200 usuario`, `400`, `401`, `409` |
| POST | `/receitas/buscar` | sim | `{ ingredientes: string[] }` | `201 Receita`, `400` lista inválida, `422` a IA não conseguiu, `429` limite de uso ou cota da IA, `503` IA indisponível ou sem configurar, `504` IA demorou |
| GET | `/receitas` | sim | — | `200 Receita[]` (da mais nova para a mais antiga, até 100) |
| PATCH | `/receitas/:id/favorito` | sim | `{ favorito: boolean }` | `200 Receita`, `400`, `404` |

**Regras:** senha de 6 a 72 caracteres · e-mail guardado em minúsculas · token vale 7 dias · de 1 a 20 ingredientes de até 40 caracteres cada.

### Como a IA é usada (`src/services/gemini.js`)

1. O servidor limpa os ingredientes (tira quebras de linha e `< >`, remove repetidos) para dificultar *prompt injection*.
2. Monta o pedido: instruções de chef + os ingredientes dentro de uma tag `<ingredientes>`. Em "Ver outras sugestões", inclui os títulos das receitas anteriores para a IA **não repetir**.
3. Pede à IA uma resposta em **JSON no formato definido por um esquema**.
4. **Não confia na resposta**: confere e limpa cada campo antes de salvar.
5. Erros técnicos (cota, chave, modelo) viram mensagens simples para o usuário, e o detalhe vai só para o terminal do servidor.

## Testes automáticos

```bash
npm test
```

Os testes **não chamam a Google** nem usam seu banco: a IA é simulada e o banco fica em memória. Eles cobrem a validação, os limites de uso, o isolamento entre usuários e a reação a respostas ruins e a erros da IA.

> Os testes não provam que a IA real responde bem. Para isso, faça uma busca de verdade pelo app.

## Estrutura de pastas

```
sobrouisso-server/
├── src/
│   ├── index.js              Ponto de entrada: liga o Express e as rotas
│   ├── database.js           Conexão SQLite + criação das tabelas
│   ├── routes/
│   │   ├── ping.js           GET /ping
│   │   ├── auth.js           Cadastro e login
│   │   ├── usuarios.js       Perfil do usuário logado
│   │   └── receitas.js       Buscar com IA, histórico e favoritos
│   ├── services/
│   │   └── gemini.js         Tudo sobre a IA: prompt, esquema, validação, erros
│   ├── middlewares/
│   │   └── autenticar.js     Confere o token JWT
│   └── utils/
│       ├── validacao.js      Regras de e-mail, nome, senha e ingredientes
│       └── limitador.js      Limite de pedidos por minuto
├── tests/                    Testes automáticos (npm test)
├── .env.example              Modelo das variáveis de ambiente
└── package.json
```

## Banco de dados

| Tabela | Para que serve |
|---|---|
| `usuarios` | Contas: nome, e-mail (único), **hash** da senha, tema |
| `receitas_geradas` | Histórico: ingredientes da busca, receita (JSON) e se é favorita |

O arquivo `sobrouisso.db` é criado automaticamente e **não** vai para o Git. Para começar do zero, pare o servidor, apague o `sobrouisso.db` e rode `npm run db:init`.

## Roadmap

- [x] Estrutura do projeto e banco SQLite
- [x] Cadastro e login (`/auth`) com bcrypt + JWT
- [x] Perfil do usuário (`/usuarios/me`)
- [x] Integração com o Gemini (`POST /receitas/buscar`)
- [x] Histórico e favoritos
- [ ] Documentação final para a disciplina
