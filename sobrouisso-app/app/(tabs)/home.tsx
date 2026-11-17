// app/(tabs)/home.tsx  ->  Tela PRINCIPAL (rota "/home")
// O usuário monta a lista de ingredientes e pede uma receita.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Logo } from "@/components/Logo";
import { fontes } from "@/constants/fontes";
import { useReceitas } from "@/context/ReceitasContext";
import { useTema } from "@/context/TemaContext";
import { mensagemDeErro } from "@/services/api";
import { avisar } from "@/services/dialogos";

export default function Home() {
  const router = useRouter();
  const { cores } = useTema();
  const { buscarReceita } = useReceitas();

  const [texto, setTexto] = useState(""); // o que está sendo digitado agora
  const [ingredientes, setIngredientes] = useState<string[]>([]); // a lista montada
  const [buscando, setBuscando] = useState(false);

  const ESTILOS = ["Normal", "Comida de Boteco", "Maromba/Fit", "Jantar Romântico"];
  const [estilo, setEstilo] = useState("Normal");

  function adicionar() {
    const novo = texto.trim();
    if (!novo) return;

    // Evita repetir o mesmo ingrediente (ignorando maiúsculas/minúsculas).
    const jaExiste = ingredientes.some((item) => item.toLowerCase() === novo.toLowerCase());
    if (!jaExiste) setIngredientes([...ingredientes, novo]);

    setTexto("");
  }

  function remover(ingrediente: string) {
    setIngredientes(ingredientes.filter((item) => item !== ingrediente));
  }

  async function buscar() {
    setBuscando(true);
    try {
      const receita = await buscarReceita(ingredientes, estilo);
      // nova: "1" faz a tela da receita mostrar o título "Receita Gerada!".
      router.push({ pathname: "/receita/[id]", params: { id: String(receita.id), nova: "1" } });
    } catch (e) {
      avisar("Ops!", mensagemDeErro(e, "Não foi possível buscar a receita."));
    } finally {
      setBuscando(false);
    }
  }

  return (
    // SafeAreaView afasta o conteúdo da barra de status (hora, bateria...).
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Logo tamanho="medio" />

        <Text style={[styles.titulo, { color: cores.texto }]}>O que tem na sua geladeira hoje?</Text>

        <View style={styles.linha}>
          <View style={styles.campoLinha}>
            <Campo
              placeholder="Digite um ingrediente..."
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={adicionar}
              returnKeyType="done"
              style={styles.campoPilula}
            />
          </View>
          <TouchableOpacity
            style={[styles.botaoMais, { backgroundColor: cores.primaria }]}
            onPress={adicionar}
            accessibilityLabel="Adicionar ingrediente"
          >
            <Ionicons name="add" size={28} color={cores.textoSobrePrimaria} />
          </TouchableOpacity>
        </View>

        {ingredientes.length > 0 ? (
          <View style={styles.secao}>
            <Text style={[styles.rotulo, { color: cores.texto }]}>Ingredientes adicionados:</Text>
            {/* Os "chips": cada ingrediente vira uma etiqueta que some ao ser tocada. */}
            <View style={styles.chips}>
              {ingredientes.map((ingrediente) => (
                <TouchableOpacity
                  key={ingrediente}
                  style={[styles.chip, { backgroundColor: cores.chip }]}
                  onPress={() => remover(ingrediente)}
                  accessibilityLabel={`Remover ${ingrediente}`}
                >
                  <Text style={[styles.chipTexto, { color: cores.texto }]}>{ingrediente}</Text>
                  <Ionicons name="close" size={15} color={cores.textoSecundario} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Text style={[styles.dica, { color: cores.textoSecundario }]}>
            Adicione pelo menos um ingrediente para buscar uma receita.
          </Text>
        )}

        <View style={styles.secao}>
          <Text style={[styles.rotulo, { color: cores.texto }]}>Estilo do Chef:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {ESTILOS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  {
                    backgroundColor: estilo === item ? cores.primaria : "transparent",
                    borderWidth: 1,
                    borderColor: estilo === item ? cores.primaria : cores.borda
                  }
                ]}
                onPress={() => setEstilo(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipTexto, { color: estilo === item ? cores.textoSobrePrimaria : cores.texto }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.acoes}>
          <Botao
            titulo="Buscar Receitas"
            icone="bulb"
            corIcone="#FFE08A"
            onPress={buscar}
            carregando={buscando}
            desabilitado={ingredientes.length === 0}
          />
          {buscando ? (
            <Text style={[styles.dica, { color: cores.textoSecundario }]}>O chef está pensando na receita...</Text>
          ) : null}
          {ingredientes.length > 0 && !buscando ? (
            <TouchableOpacity onPress={() => setIngredientes([])}>
              <Text style={[styles.limpar, { color: cores.textoSecundario }]}>Limpar lista</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
  },
  titulo: {
    fontFamily: fontes.extrabold,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    marginTop: 28,
    marginBottom: 24,
  },
  linha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  campoLinha: {
    flex: 1,
  },
  campoPilula: {
    borderRadius: 25, // deixa o campo totalmente arredondado (pílula)
  },
  botaoMais: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  secao: {
    marginTop: 8,
  },
  rotulo: {
    fontFamily: fontes.extrabold,
    fontSize: 16,
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipTexto: {
    fontFamily: fontes.semibold,
    fontSize: 15,
  },
  dica: {
    marginTop: 8,
    textAlign: "center",
  },
  acoes: {
    marginTop: 32,
    gap: 16,
    alignItems: "center",
  },
  limpar: {
    fontFamily: fontes.semibold,
    textDecorationLine: "underline",
  },
});
