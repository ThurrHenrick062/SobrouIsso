// components/Logo.tsx
// A marca do app: panela + "SobrouIsso" em duas cores.
// Usada no login, na Home e no cabeçalho da receita.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { fontes } from "@/constants/fontes";
import { useTema } from "@/context/TemaContext";

interface Props {
  tamanho?: "grande" | "medio" | "pequeno";
  comIcone?: boolean; // false = só o nome (usado no cabeçalho)
}

const medidas = {
  grande: { icone: 76, texto: 42 },
  medio: { icone: 56, texto: 32 },
  pequeno: { icone: 28, texto: 22 },
};

export function Logo({ tamanho = "grande", comIcone = true }: Props) {
  const { cores } = useTema();
  const { icone, texto } = medidas[tamanho];

  return (
    <View style={styles.centro} accessibilityLabel="SobrouIsso">
      {comIcone ? <MaterialCommunityIcons name="pot-steam-outline" size={icone} color={cores.primaria} /> : null}
      <Text style={{ fontFamily: fontes.extrabold, fontSize: texto }}>
        <Text style={{ color: cores.verde }}>Sobrou</Text>
        <Text style={{ color: cores.primaria }}>Isso</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    alignItems: "center",
  },
});
