// components/Campo.tsx
// Campo de texto reutilizável, com o rótulo em cima e cantos bem arredondados.
// Aceita todas as props normais de um TextInput (placeholder, value,
// onChangeText, secureTextEntry...) graças ao "...resto".

import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { fontes } from "@/constants/fontes";
import { useTema } from "@/context/TemaContext";

interface Props extends TextInputProps {
  rotulo?: string; // texto pequeno acima do campo (opcional)
}

export function Campo({ rotulo, style, ...resto }: Props) {
  const { cores } = useTema();

  return (
    <View style={styles.grupo}>
      {rotulo ? <Text style={[styles.rotulo, { color: cores.texto }]}>{rotulo}</Text> : null}
      <TextInput
        placeholderTextColor={cores.textoSecundario}
        style={[
          styles.campo,
          { borderColor: cores.borda, backgroundColor: cores.superficie, color: cores.texto },
          style,
        ]}
        {...resto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    width: "100%",
    marginBottom: 14,
  },
  rotulo: {
    fontFamily: fontes.bold,
    fontSize: 14,
    marginBottom: 6,
  },
  campo: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: fontes.regular,
    fontSize: 15,
  },
});
