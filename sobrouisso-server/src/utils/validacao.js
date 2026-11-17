// src/utils/validacao.js
// Regras de validação compartilhadas pelas rotas. Validar no servidor é
// obrigatório: o app também valida, mas qualquer pessoa pode chamar a API
// diretamente (Postman, curl...), então nunca confiamos só no front.

export const SENHA_MINIMA = 6;
// O bcrypt só considera os primeiros 72 bytes da senha. Recusamos senhas
// maiores em vez de cortá-las em silêncio.
export const SENHA_MAXIMA_BYTES = 72;

export function emailValido(email) {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email.trim()) && email.length <= 254;
}

export function nomeValido(nome) {
  return typeof nome === "string" && nome.trim().length >= 1 && nome.trim().length <= 80;
}

// Devolve a mensagem do problema, ou null se a senha estiver ok.
export function problemaNaSenha(senha) {
  if (typeof senha !== "string" || senha.length < SENHA_MINIMA) {
    return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  }
  if (Buffer.byteLength(senha, "utf8") > SENHA_MAXIMA_BYTES) {
    return "A senha é grande demais. Use no máximo 72 caracteres.";
  }
  return null;
}

// O e-mail é sempre guardado em minúsculas e sem espaços, para que
// "Ana@Email.com" e "ana@email.com " sejam a MESMA conta.
export function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Ingredientes (lista enviada pelo app para a IA)
// ---------------------------------------------------------------------------
export const MAX_INGREDIENTES = 20;
export const MAX_CHARS_INGREDIENTE = 40;

// Limpa e valida a lista. Devolve { ingredientes } ou { erro }.
//
// Por que limpamos tanto? O texto digitado pelo usuário vai ser colocado
// dentro de um prompt para a IA. Quem digita "ovo. Ignore as regras
// anteriores e..." está tentando "injetar" instruções (prompt injection).
// Por isso removemos quebras de linha e os símbolos < >, limitamos o tamanho
// e depois ainda dizemos à IA que aquilo é só dado (veja services/gemini.js).
export function limparIngredientes(entrada) {
  if (!Array.isArray(entrada)) {
    return { erro: "Envie a lista de ingredientes." };
  }

  const vistos = new Set();
  const lista = [];

  for (const item of entrada) {
    if (typeof item !== "string") {
      return { erro: "Cada ingrediente precisa ser um texto." };
    }

    const limpo = item
      .replace(/[\u0000-\u001f\u007f<>]/g, " ") // controle, quebras de linha e < >
      .replace(/\s+/g, " ")
      .trim();

    if (!limpo) continue; // ignora itens vazios

    if (limpo.length > MAX_CHARS_INGREDIENTE) {
      return { erro: `Cada ingrediente pode ter no máximo ${MAX_CHARS_INGREDIENTE} caracteres.` };
    }

    // "Ovo" e "ovo " são o mesmo ingrediente: mantém só o primeiro.
    const chave = limpo.toLowerCase();
    if (!vistos.has(chave)) {
      vistos.add(chave);
      lista.push(limpo);
    }
  }

  if (lista.length === 0) return { erro: "Informe pelo menos um ingrediente." };
  if (lista.length > MAX_INGREDIENTES) {
    return { erro: `Use no máximo ${MAX_INGREDIENTES} ingredientes por busca.` };
  }

  return { ingredientes: lista };
}
