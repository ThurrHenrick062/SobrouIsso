// services/dialogos.ts
// Avisos e confirmações que funcionam no CELULAR e no NAVEGADOR.
//
// Por que isso existe? O Alert.alert do React Native não faz nada na versão
// web: o aviso simplesmente não aparece e os botões nunca são executados.
// Aqui escolhemos o jeito certo de acordo com a plataforma onde o app roda.

import { Alert, Platform } from "react-native";

// Mostra uma mensagem simples (equivalente a Alert.alert(titulo, mensagem)).
export function avisar(titulo: string, mensagem?: string) {
  if (Platform.OS === "web") {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }
  Alert.alert(titulo, mensagem);
}

// Pergunta "tem certeza?" e devolve true (confirmou) ou false (cancelou).
// Uso:  if (await confirmar("Sair", "Deseja sair?", "Sair")) { ... }
export function confirmar(
  titulo: string,
  mensagem: string,
  textoConfirmar = "Confirmar"
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }

  // No celular, o Alert só avisa por callback; embrulhamos numa Promise
  // para poder usar await.
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: textoConfirmar, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}