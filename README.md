# 🍳 SobrouIsso

App mobile que sugere receitas a partir dos ingredientes que você tem em casa, combatendo o desperdício de alimentos. Projeto extensionista de Desenvolvimento Mobile.

```
SobrouIsso/
├── sobrouisso-app/       App mobile (React Native + Expo SDK 58 + Expo Router + TypeScript)
└── sobrouisso-server/    Backend (Node.js + Express + SQLite + Gemini)
```

## 1. Rodar o backend (precisa estar ligado para cadastro e login)

```bash
cd sobrouisso-server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# abra o .env e preencha o JWT_SECRET e a GEMINI_API_KEY (instruções dentro do arquivo)
npm run db:init
npm run dev
```

Teste em <http://localhost:3000/ping>.

## 2. Rodar o app

```bash
cd sobrouisso-app
npm install
npx expo start
```

Abra com o **Expo Go** (celular e PC no mesmo Wi-Fi) ou aperte `a` para o emulador Android.

## 3. Ligar o app ao servidor

Em `sobrouisso-app/constants/config.ts`, coloque o **IP do seu computador** (`ipconfig` no Windows):

```ts
export const API_URL = "http://SEU_IP:3000";   // não use "localhost" no celular
```

Antes de abrir o app, teste no navegador do celular: `http://SEU_IP:3000/ping` deve mostrar `pong`.

Hoje **tudo é de verdade**: cadastro, login, receitas geradas pela IA (Gemini), histórico e favoritos. As chaves `USAR_MOCK_AUTH` e `USAR_MOCK_RECEITAS` (no mesmo arquivo) permitem voltar a dados falsos se o servidor ou a cota da IA não estiverem disponíveis.

Para usar a IA você precisa de uma **chave grátis do Gemini**: <https://aistudio.google.com/apikey>. Detalhes e cuidados com a cota gratuita estão em `sobrouisso-server/README.md`.

## Git

Cada pasta tem o seu `.gitignore` (`node_modules`, `.env` e o banco `.db` ficam de fora).
Você pode versionar tudo em um único repositório: rode `git init` dentro de `SobrouIsso/`.

## Roadmap

- [x] Banco SQLite + servidor Express (`/ping`)
- [x] App: login, cadastro, início, receita, favoritos, recentes, configurações e tema
- [x] App atualizado para o Expo SDK 58
- [x] Backend: cadastro e login (`/auth`) com bcrypt + JWT
- [x] Backend: perfil do usuário (`/usuarios/me`)
- [x] Backend: integração com o Gemini (`/receitas/buscar`)
- [x] Backend: histórico e favoritos
- [x] Conectar as receitas do app ao servidor (`USAR_MOCK_RECEITAS = false`)
- [ ] Documentação final para a disciplina
