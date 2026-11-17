// src/utils/limitador.js
// Limitador de uso simples, na memória: "no máximo N pedidos a cada X tempo".
//
// Para que serve aqui? A IA tem uma cota gratuita pequena (alguns pedidos
// por minuto, para o PROJETO inteiro). Sem limite, uma pessoa apertando o
// botão várias vezes, ou um colega testando junto, esgota a cota de todos.
// Cada "chave" tem a sua própria contagem (ex.: o id de cada usuário).

export function criarLimitador(maximo, janelaMs) {
  const registros = new Map(); // chave -> lista de horários dos pedidos recentes

  return {
    // Tenta registrar um pedido. Devolve { permitido, esperarSegundos }.
    tentar(chave = "global") {
      const agora = Date.now();
      // Só interessam os pedidos que ainda estão dentro da janela de tempo.
      const recentes = (registros.get(chave) ?? []).filter((momento) => agora - momento < janelaMs);

      if (recentes.length >= maximo) {
        registros.set(chave, recentes);
        const esperarSegundos = Math.ceil((janelaMs - (agora - recentes[0])) / 1000);
        return { permitido: false, esperarSegundos };
      }

      recentes.push(agora);
      registros.set(chave, recentes);
      return { permitido: true, esperarSegundos: 0 };
    },
  };
}
