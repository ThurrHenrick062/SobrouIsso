# 🍳 SobrouIsso — Frontend (React Native + Expo Router)

Estes arquivos foram feitos para **entrar no seu esqueleto atual**, mantendo a estrutura Expo SDK 54 + Expo Router + TypeScript.

## Como instalar

1. Extraia o zip **por cima da pasta do seu projeto** (as pastas `app/`, `components/`, `constants/`, `context/`, `services/` e `types/` se juntam ao que você já tem).
   Ele **substitui** o seu `app/index.tsx` e o `app/_layout.tsx`. O login manteve o seu visual (campos com sombra, botão azul arredondado).
2. Instale a única dependência nova:
   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```
3. Rode o app:
   ```bash
   npx expo start
   ```
   Escaneie o QR code com o **Expo Go** no celular, ou aperte `a` para o emulador Android.

## Conectando ao backend

O **cadastro e o login agora são de verdade**: o app conversa com o servidor, que guarda as contas no banco SQLite (senha criptografada). Por isso o servidor precisa estar rodando.

1. Suba o servidor (`npm run dev`, na pasta `sobrouisso-server`).
2. Descubra o IP do seu computador (`ipconfig` no Windows, "Endereço IPv4" do Wi-Fi) e coloque em `constants/config.ts`:
   ```ts
   export const API_URL = "http://SEU_IP:3000"; // NÃO use "localhost" no celular
   ```
3. No celular, abra `http://SEU_IP:3000/ping` no navegador. Se aparecer `pong`, o celular enxerga o servidor.

As chaves de `constants/config.ts`:

| Chave | Valor atual | O que faz |
|---|---|---|
| `USAR_MOCK_AUTH` | `false` | Cadastro, login e perfil usam o servidor **real** |
| `USAR_MOCK_RECEITAS` | `false` | Receitas (buscar, histórico, favoritos) usam o servidor **real**, com a IA |

Sem o servidor, sem a chave do Gemini ou sem cota? Coloque a chave correspondente em `true`: o app usa um servidor falso na memória (que esquece tudo ao fechar o app). O mock de login também só aceita contas já cadastradas. Nas receitas, o mock devolve sempre uma receita genérica.

As receitas vêm da IA, então **a busca leva alguns segundos**. Se aparecer "A IA está com muitos pedidos agora", a cota gratuita do Gemini foi atingida: aguarde um minuto.

O servidor precisa seguir este contrato (usado por `services/api.ts`). Erros devem vir como `{ "erro": "mensagem" }`.

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/cadastro` | `{ nome, email, senha }` | `{ token, usuario }` |
| POST | `/auth/login` | `{ email, senha }` | `{ token, usuario }` |
| PUT | `/usuarios/me` | `{ nome, email, senha? }` | `usuario` |
| POST | `/receitas/buscar` | `{ ingredientes: string[] }` | `Receita` |
| GET | `/receitas` | — | `Receita[]` (da mais nova para a mais antiga) |
| PATCH | `/receitas/:id/favorito` | `{ favorito: boolean }` | `Receita` |

Rotas com `token` esperam o cabeçalho `Authorization: Bearer <token>`. Os formatos de `usuario` e `Receita` estão em `types/index.ts`.

A `Receita` aceita o campo opcional `dificuldade` (ex.: `"Muito fácil"`). Quando o servidor o enviar, ele aparece na tela da receita; quando não enviar, a tela simplesmente o omite.

## Estrutura

```
app/
├── _layout.tsx          Raiz: provedores + controle de quem vê o quê (Stack.Protected)
├── index.tsx            Login            -> "/"
├── cadastro.tsx         Cadastro         -> "/cadastro"
├── (tabs)/              Grupo de abas (o nome da pasta não entra na rota)
│   ├── _layout.tsx      Barra de abas
│   ├── home.tsx         Tela principal   -> "/home"
│   ├── favoritos.tsx    Favoritos        -> "/favoritos"
│   ├── recentes.tsx     Recentes         -> "/recentes"
│   └── config.tsx       Configurações    -> "/config"
└── receita/[id].tsx     Detalhe          -> "/receita/12"
components/              Peças reutilizáveis (Botao, Campo, CartaoReceita, ListaReceitas...)
constants/               config.ts (endereço do servidor e chaves de mock) e temas.ts (cores)
context/                 Estado global: Auth (login), Tema, Receitas
services/                api.ts (fala com o servidor), mock.ts (servidor falso) e sessao.ts (token)
types/                   Formatos dos dados (Usuario, Receita...)
```

## Visual (cores e fontes)

- **Cores:** todas em `constants/temas.ts` (creme, laranja queimado e verde-escuro, nos temas claro e escuro).
- **Fonte:** Nunito (`@expo-google-fonts/nunito`), carregada em `app/_layout.tsx`. Os nomes ficam em `constants/fontes.ts`.
- **Logotipo:** `components/Logo.tsx`.
- **Emojis dos ingredientes:** `constants/ingredientes.ts` (🍚 arroz, 🥚 ovo...). Para ensinar um ingrediente novo ao app, basta acrescentar uma linha lá.
- "Esqueci minha senha" e "Entrar com o Google" aparecem no login, mas ainda só mostram um aviso de "em breve".

## Conceitos para estudar (em ordem)

1. **Rotas por arquivo** — `app/` define as telas (Expo Router).
2. **`useState`** — como o app "lembra" o que foi digitado (`index.tsx`, `home.tsx`).
3. **Componentes reutilizáveis** — `Botao` e `Campo` evitam repetir código.
4. **Context** — dados compartilhados entre telas sem passar props (`context/`).
5. **Camada de serviço** — as telas nunca chamam `fetch`; só `api.*` (`services/`).
6. **Rotas protegidas** — `Stack.Protected` em `app/_layout.tsx`.

## Ideias para evoluir

- Sincronizar o tema com a coluna `tema` do banco.
- Guardar o token no `expo-secure-store` (criptografado).
- Botão de excluir conta nas configurações.
- Tela "Esqueci minha senha".
