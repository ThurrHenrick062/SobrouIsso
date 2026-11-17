// components/CartaoReceita.tsx
// Um "cartão" que resume uma receita na lista. Tocar nele abre o detalhe.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fontes } from "@/constants/fontes";
import { iconeDoIngrediente } from "@/constants/ingredientes";
import { useTema } from "@/context/TemaContext";
import type { Receita } from "@/types";

export function CartaoReceita({ receita }: { receita: Receita }) {
  const { cores } = useTema();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
      activeOpacity={0.8}
      // "[id]" no nome do arquivo (app/receita/[id].tsx) recebe este valor.
      onPress={() => router.push({ pathname: "/receita/[id]", params: { id: String(receita.id) } })}
    >
      <View style={styles.topo}>
        <Text style={[styles.titulo, { color: cores.titulo }]} numberOfLines={2}>
          {receita.titulo}
        </Text>
        {receita.favorito ? <Ionicons name="heart" size={20} color={cores.primaria} /> : null}
      </View>

      <View style={styles.meta}>
        <Ionicons name="time-outline" size={16} color={cores.primaria} />
        <Text style={{ color: cores.textoSecundario }}>
          {receita.tempoPreparo}
          {receita.dificuldade ? `  •  ${receita.dificuldade}` : ""}
        </Text>
      </View>

      {/* Um emoji para cada ingrediente usado (🍚 🥚 🍅...). */}
      <Text style={styles.emojis} numberOfLines={1}>
        {receita.ingredientesBusca.slice(0, 8).map(iconeDoIngrediente).join("  ")}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontFamily: fontes.extrabold,
    fontSize: 18,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emojis: {
    fontSize: 18,
  },
});
