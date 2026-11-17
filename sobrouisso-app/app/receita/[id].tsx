// app/receita/[id].tsx  ->  DETALHE da receita (rota "/receita/12")
// Os colchetes no nome do arquivo criam uma rota DINÂMICA: o trecho "[id]"
// vira um parâmetro que lemos com useLocalSearchParams().

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Botao } from "@/components/Botao";
import { fontes } from "@/constants/fontes";
import { iconeDoIngrediente } from "@/constants/ingredientes";
import { useReceitas } from "@/context/ReceitasContext";
import { useTema } from "@/context/TemaContext";
import { mensagemDeErro } from "@/services/api";
import { avisar } from "@/services/dialogos";

export default function DetalheReceita() {
  // Os parâmetros de rota chegam sempre como texto.
  const { id, nova } = useLocalSearchParams<{ id: string; nova?: string }>();
  const router = useRouter();
  const { receitas, alternarFavorito, buscarReceita } = useReceitas();
  const { cores } = useTema();
  const [salvando, setSalvando] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const receita = receitas.find((r) => String(r.id) === id);

  if (!receita) {
    return (
      <View style={[styles.centro, { backgroundColor: cores.fundo }]}>
        <Text style={{ color: cores.texto }}>Receita não encontrada.</Text>
      </View>
    );
  }

  // Verificação simples: o ingrediente da receita contém algo que o usuário digitou?
  const jaTenho = (ingrediente: string) =>
    receita.ingredientesBusca.some((item) => ingrediente.toLowerCase().includes(item.toLowerCase()));

  // O que a receita pede além do que o usuário já tem (ex.: óleo, sal).
  const faltantes = receita.ingredientes.filter((ingrediente) => !jaTenho(ingrediente));

  const favoritar = async () => {
    setSalvando(true);
    try {
      await alternarFavorito(receita.id);
    } catch (e) {
      avisar("Ops!", mensagemDeErro(e, "Não foi possível atualizar o favorito."));
    } finally {
      setSalvando(false);
    }
  };

  // Pede OUTRA receita com os mesmos ingredientes e troca a tela atual por ela.
  const verOutras = async () => {
    setBuscando(true);
    try {
      const outra = await buscarReceita(receita.ingredientesBusca);
      router.replace({ pathname: "/receita/[id]", params: { id: String(outra.id), nova: "1" } });
    } catch (e) {
      avisar("Ops!", mensagemDeErro(e, "Não foi possível buscar outra receita."));
    } finally {
      setBuscando(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: cores.fundo }} contentContainerStyle={styles.conteudo}>
      {/* Só aparece quando a receita acabou de ser gerada pela Home. */}
      {nova === "1" ? (
        <Text style={[styles.gerada, { color: cores.texto }]}>Receita Gerada! ✨</Text>
      ) : null}

      <Text style={[styles.titulo, { color: cores.titulo }]}>{receita.titulo}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={18} color={cores.primaria} />
          <Text style={[styles.metaTexto, { color: cores.texto }]}>{receita.tempoPreparo}</Text>
        </View>
        {receita.dificuldade ? (
          <View style={styles.metaItem}>
            <Ionicons name="restaurant-outline" size={18} color={cores.primaria} />
            <Text style={[styles.metaTexto, { color: cores.texto }]}>{receita.dificuldade}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.secao, { color: cores.texto }]}>Ingredientes aproveitados:</Text>
      <View style={styles.aproveitados}>
        {receita.ingredientesBusca.map((ingrediente) => (
          <Text key={ingrediente} style={[styles.aproveitado, { color: cores.texto }]}>
            {iconeDoIngrediente(ingrediente)} {ingrediente}
          </Text>
        ))}
      </View>

      {faltantes.length > 0 ? (
        <>
          <Text style={[styles.secao, { color: cores.texto }]}>Você vai precisar também:</Text>
          {faltantes.map((ingrediente, indice) => (
            <Text key={indice} style={[styles.item, { color: cores.texto }]}>
              • {ingrediente}
            </Text>
          ))}
        </>
      ) : null}

      <Text style={[styles.secao, { color: cores.texto }]}>Modo de preparo:</Text>
      {receita.modoPreparo.map((passo, indice) => (
        <Text key={indice} style={[styles.item, { color: cores.texto }]}>
          {indice + 1}. {passo}
        </Text>
      ))}

      <View style={styles.acoes}>
        <Botao
          titulo={receita.favorito ? "Receita Salva" : "Salvar Receita"}
          icone={receita.favorito ? "heart" : "heart-outline"}
          onPress={favoritar}
          carregando={salvando}
        />
        <TouchableOpacity onPress={verOutras} disabled={buscando}>
          <Text style={[styles.link, { color: cores.textoSecundario }]}>
            {buscando ? "Buscando outra receita..." : "Ver outras sugestões"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate("/home")}>
          <Text style={[styles.link, { color: cores.textoSecundario }]}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  conteudo: {
    padding: 24,
    paddingBottom: 40,
  },
  gerada: {
    fontFamily: fontes.semibold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  titulo: {
    fontFamily: fontes.extrabold,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
  },
  meta: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaTexto: {
    fontFamily: fontes.semibold,
  },
  secao: {
    fontFamily: fontes.extrabold,
    fontSize: 18,
    marginTop: 28,
    marginBottom: 10,
  },
  aproveitados: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  aproveitado: {
    fontFamily: fontes.semibold,
    fontSize: 16,
  },
  item: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
  },
  acoes: {
    marginTop: 32,
    gap: 18,
    alignItems: "center",
  },
  link: {
    fontFamily: fontes.semibold,
  },
});
