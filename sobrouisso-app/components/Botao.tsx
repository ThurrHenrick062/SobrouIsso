// components/Botao.tsx
// Botão reutilizável. Em vez de repetir o estilo em cada tela, criamos o
// botão UMA vez aqui e usamos <Botao titulo="Entrar" onPress={...} /> em todo lugar.

import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { fontes } from "@/constants/fontes";
import { useTema } from "@/context/TemaContext";

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: "primario" | "secundario" | "perigo";
  carregando?: boolean;
  desabilitado?: boolean;
  icone?: ComponentProps<typeof Ionicons>["name"]; // ícone depois do texto (opcional)
  corIcone?: string; // por padrão usa a cor do texto
}

export function Botao({
  titulo,
  onPress,
  variante = "primario",
  carregando = false,
  desabilitado = false,
  icone,
  corIcone,
}: Props) {
  const { cores } = useTema();

  const fundo = variante === "primario" ? cores.primaria : variante === "perigo" ? cores.erro : "transparent";
  const corTexto =
    variante === "primario" ? cores.textoSobrePrimaria : variante === "perigo" ? "#FFFFFF" : cores.primaria;
  const inativo = desabilitado || carregando;

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        { backgroundColor: fundo, opacity: inativo ? 0.5 : 1 },
        variante === "secundario" ? { borderWidth: 1.5, borderColor: cores.primaria } : styles.sombra,
      ]}
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.85}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          <Text style={[styles.texto, { color: corTexto }]}>{titulo}</Text>
          {icone ? <Ionicons name={icone} size={20} color={corIcone ?? corTexto} /> : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  texto: {
    fontFamily: fontes.bold,
    fontSize: 17,
  },
  // iOS usa shadow*, Android usa elevation.
  sombra: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
});
