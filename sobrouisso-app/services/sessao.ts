// services/sessao.ts
// Guarda, na memória, o token do usuário logado (o "crachá" enviado ao
// servidor em toda requisição) e o aviso de "sessão expirada".
// Fica em um arquivo próprio para a api.ts e o mock.ts poderem usá-lo
// sem um importar o outro.

let tokenAtual: string | null = null;
let aoSessaoExpirar: (() => void) | null = null;

export function definirToken(token: string | null) {
  tokenAtual = token;
}

export function obterToken() {
  return tokenAtual;
}

// O AuthContext registra aqui o que fazer quando o servidor disser que o
// token não vale mais (expirou, ou a conta não existe mais).
export function definirAoSessaoExpirar(funcao: () => void) {
  aoSessaoExpirar = funcao;
}

export function avisarSessaoExpirada() {
  aoSessaoExpirar?.();
}
