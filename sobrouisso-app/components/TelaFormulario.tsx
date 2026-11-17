// components/TelaFormulario.tsx
// Moldura para telas com campos de texto. Resolve dois problemas clássicos:
//  1) o teclado cobrindo os campos (KeyboardAvoidingView);
//  2) conteúdo maior que a tela (ScrollView).

import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";
import { useTema } from "@/context/TemaContext";

interface Props {
  children: ReactNode;
  centralizar?: boolean; // true = conteúdo no meio da tela (login/cadastro)
}

export function TelaFormulario({ children, centralizar = true }: Props) {
  const { cores } = useTema();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cores.fundo }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.conteudo, centralizar && styles.centralizado]}
        // "handled": tocar em um botão com o teclado aberto funciona de primeira.
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
  },
  centralizado: {
    justifyContent: "center",
  },
});
