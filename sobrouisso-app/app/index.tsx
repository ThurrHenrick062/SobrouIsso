// app/index.tsx  ->  Tela de LOGIN (rota "/")

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { Logo } from "@/components/Logo";
import { TelaFormulario } from "@/components/TelaFormulario";
import { fontes } from "@/constants/fontes";
import { useAuth } from "@/context/AuthContext";
import { useTema } from "@/context/TemaContext";
import { mensagemDeErro } from "@/services/api";
import { avisar } from "@/services/dialogos";

// "Esqueci minha senha" e "Entrar com o Google" estão no design, mas ainda
// não existem no backend. Por enquanto só avisam que virão depois.
function avisarEmBreve() {
  avisar("Em breve", "Este recurso ainda não está disponível.");
}

export default function Login() {
  const router = useRouter();
  const { entrar } = useAuth();
  const { cores } = useTema();

  // useState guarda o que o usuário digitou. A cada letra, o valor muda
  // e a tela é desenhada de novo.
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setErro("");
    setCarregando(true);
    try {
      await entrar(email.trim().toLowerCase(), senha);
      // Não precisa navegar: ao logar, o Stack.Protected leva às abas sozinho.
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível entrar."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaFormulario>
      <View style={styles.form}>
        <Logo tamanho="grande" />
        <Text style={[styles.tagline, { color: cores.texto }]}>
          Transforme o que sobrou{"\n"}em receitas incríveis.
        </Text>

        <Campo
          rotulo="E-mail"
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Campo
          rotulo="Senha"
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity style={styles.esqueci} onPress={avisarEmBreve}>
          <Text style={[styles.linkPequeno, { color: cores.texto }]}>Esqueci minha senha</Text>
        </TouchableOpacity>

        {erro ? <Text style={[styles.erro, { color: cores.erro }]}>{erro}</Text> : null}

        <View style={styles.botao}>
          <Botao titulo="Entrar" onPress={handleLogin} carregando={carregando} />
        </View>

        <View style={styles.linhaCadastro}>
          <Text style={{ color: cores.texto }}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push("/cadastro")}>
            <Text style={[styles.cadastre, { color: cores.texto }]}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.google, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
          onPress={avisarEmBreve}
        >
          <Ionicons name="logo-google" size={18} color={cores.texto} />
          <Text style={[styles.googleTexto, { color: cores.texto }]}>Entrar com o Google</Text>
        </TouchableOpacity>
      </View>
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  tagline: {
    fontFamily: fontes.semibold,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  esqueci: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  linkPequeno: {
    fontFamily: fontes.semibold,
    fontSize: 13,
    textDecorationLine: "underline",
  },
  erro: {
    marginTop: 12,
    textAlign: "center",
  },
  botao: {
    width: "100%",
    marginTop: 20,
  },
  linhaCadastro: {
    flexDirection: "row",
    marginTop: 18,
    marginBottom: 20,
  },
  cadastre: {
    fontFamily: fontes.extrabold,
  },
  google: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  googleTexto: {
    fontFamily: fontes.semibold,
  },
});
