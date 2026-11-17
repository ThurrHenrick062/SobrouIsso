// components/ListaReceitas.tsx
// Lista de receitas com campo de PESQUISA e puxar-para-atualizar.
// É usada por duas telas (Favoritos e Recentes): escrevemos uma vez e
// reaproveitamos, mudando só quais receitas entram e os textos de "lista vazia".

import { FlatList, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { fontes } from "@/constants/fontes";
import { useReceitas } from "@/context/ReceitasContext";
import { useTema } from "@/context/TemaContext";
import type { Receita } from "@/types";
import { CartaoReceita } from "./CartaoReceita";
import { Campo } from "./Campo";

interface Props {
  receitas: Receita[];
  vazioTitulo: string;
  vazioTexto: string;
}

export function ListaReceitas({ receitas, vazioTitulo, vazioTexto }: Props) {
  const { cores } = useTema();
  const { recarregar, carregando } = useReceitas();
  const [busca, setBusca] = useState("");

  // Pesquisa: procura o texto no título e nos ingredientes da receita.
  const termo = busca.trim().toLowerCase();
  const filtradas =
    termo === ""
      ? receitas
      : receitas.filter(
          (r) =>
            r.titulo.toLowerCase().includes(termo) ||
            r.ingredientes.some((ingrediente) => ingrediente.toLowerCase().includes(termo))
        );

  const pesquisando = termo !== "";

  return (
    <FlatList
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={styles.conteudo}
      data={filtradas}
      keyExtractor={(receita) => String(receita.id)}
      renderItem={({ item }) => <CartaoReceita receita={item} />}
      keyboardShouldPersistTaps="handled"
      refreshing={carregando}
      onRefresh={recarregar}
      ListHeaderComponent={
        receitas.length > 0 ? (
          <Campo placeholder="Pesquisar receita ou ingrediente" value={busca} onChangeText={setBusca} />
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.vazio}>
          <Text style={[styles.vazioTitulo, { color: cores.texto }]}>
            {pesquisando ? "Nenhuma receita encontrada" : vazioTitulo}
          </Text>
          <Text style={{ color: cores.textoSecundario, textAlign: "center", fontFamily: fontes.regular }}>
            {pesquisando ? "Tente pesquisar por outro nome ou ingrediente." : vazioTexto}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 48,
  },
  vazioTitulo: {
    fontSize: 20,
    fontFamily: fontes.extrabold,
  },
});
