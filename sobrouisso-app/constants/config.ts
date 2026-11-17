// constants/config.ts
// Configurações gerais do app. É aqui que você liga o front ao backend.

// true  = usa dados FALSOS (mock), sem precisar do servidor rodando.
// false = conversa com o servidor Node.js de verdade (e com a IA).
//
// São duas chaves separadas para você poder testar uma parte sem a outra.
// Exemplo útil: sem chave do Gemini ou sem cota, deixe USAR_MOCK_RECEITAS = true
// e o app continua funcionando com receitas de mentira.
export const USAR_MOCK_AUTH = false; // cadastro, login e dados do perfil
export const USAR_MOCK_RECEITAS = false; // buscar, listar e favoritar receitas (IA)

// Endereço do servidor. Atenção: "localhost" NÃO funciona no celular,
// porque lá "localhost" é o próprio celular. Use o IP do seu computador:
//   - Descubra com: ipconfig (Windows) -> "Endereço IPv4" do Wi-Fi
//   - Celular físico (mesmo Wi-Fi do PC): http://SEU_IP:3000
//   - Emulador Android: http://10.0.2.2:3000
//   - Navegador (versão web) no próprio PC: http://localhost:3000
export const API_URL = "http://localhost:3000";
