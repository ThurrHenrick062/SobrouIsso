🍳 SobrouIsso

O SobrouIsso é um aplicativo mobile que transforma os ingredientes esquecidos na sua geladeira em pratos incríveis. Focado no combate ao desperdício de alimentos, o app utiliza Inteligência Artificial para criar receitas personalizadas com o que você já tem em casa.

Este é um projeto extensionista da disciplina de Desenvolvimento Mobile.

✨ Funcionalidades

👨‍🍳 Receitas por IA: Digite os ingredientes que você tem (ex: "arroz", "ovo", "tomate") e a IA cria uma receita prática e deliciosa.

🎭 Estilos do Chef (Novo!): Quer um prato diferente? Peça para a IA gerar a receita no estilo "Comida de Boteco", "Maromba/Fit" ou "Jantar Romântico".

❤️ Favoritos e Histórico: O app salva todas as receitas geradas para você consultar depois. Marque as melhores com um coração!

🌓 Tema Claro e Escuro: A interface se adapta à sua preferência ou ao sistema do seu celular.

🔐 Contas de Usuário: Autenticação completa (cadastro, login, edição de perfil) garantindo que seu livro de receitas seja só seu.

🛠️ Tecnologias Utilizadas

Frontend (Mobile):

React Native & Expo (SDK 58)

Expo Router (Navegação baseada em arquivos)

Context API (Gerenciamento de estado)

Async Storage (Sessão local)

Backend (API):

Node.js & Express

SQLite (com better-sqlite3)

Autenticação JWT (JSON Web Tokens) & bcryptjs

Google Gemini API (Geração de conteúdo generativo)

🚀 Como rodar o projeto localmente

O projeto está dividido em duas partes principais:

SobrouIsso/
├── sobrouisso-app/       # Aplicativo Mobile
└── sobrouisso-server/    # API e Banco de Dados


1. Rodar o Backend (Servidor)

O servidor precisa estar ligado para que o cadastro, login e a geração de receitas funcionem.

cd sobrouisso-server
npm install
cp .env.example .env        # No Windows use: copy .env.example .env


Abra o arquivo .env gerado e preencha o JWT_SECRET e a sua GEMINI_API_KEY (instruções dentro do arquivo).

npm run db:init             # Cria o banco de dados SQLite
npm run dev                 # Inicia o servidor


Teste acessando http://localhost:3000/ping no seu navegador.

2. Rodar o App (Frontend)

Abra um novo terminal e execute:

cd sobrouisso-app
npm install
npx expo start


Abra o app usando o aplicativo Expo Go no seu celular (conectado ao mesmo Wi-Fi do computador) ou pressione a para abrir no emulador Android.

3. Ligar o App ao Servidor

No arquivo sobrouisso-app/constants/config.ts, altere o endereço da API para o IP da sua máquina na rede local (descubra usando o comando ipconfig no Windows ou ifconfig no Mac/Linux):

export const API_URL = "http://SEU_IP_AQUI:3000";   // Não use "localhost" no celular


Dica: Você pode testar se o celular alcança o servidor abrindo http://SEU_IP_AQUI:3000/ping no navegador do aparelho.

🗺️ Roadmap e Progresso

[x] Banco SQLite + servidor Express (/ping)

[x] App: login, cadastro, início, receita, favoritos, recentes, configurações e tema

[x] App atualizado para o Expo SDK 58

[x] Backend: cadastro e login (/auth) com bcrypt + JWT

[x] Backend: perfil do usuário (/usuarios/me)

[x] Backend: integração com o Gemini (/receitas/buscar)

[x] Backend: histórico e favoritos

[x] Conectar as receitas do app ao servidor real (USAR_MOCK_RECEITAS = false)

[x] Adicionado Filtros de "Estilos do Chef" na geração de receitas

[ ] Documentação final para a disciplina