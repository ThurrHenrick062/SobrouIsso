// src/middlewares/autenticar.js
// Middleware = função que roda ANTES da rota. Este exige um token válido:
// o app manda "Authorization: Bearer <token>" e aqui conferimos se o token
// foi realmente gerado por este servidor (assinatura) e ainda não expirou.
// Se estiver tudo certo, guardamos o id do usuário em req.usuarioId.

import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? "").split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Faça login para continuar." });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = dados.id;
    next();
  } catch {
    // Token adulterado, expirado ou assinado com outro segredo.
    return res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
  }
}
