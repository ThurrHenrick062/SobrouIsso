// app/cadastro.tsx  ->  Tela de CADASTRO (rota "/cadastro")

import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { TelaFormulario } from "@/components/TelaFormulario";
import { useAuth } from "@/context/AuthContext";
import { useTema } from "@/context/TemaContext";
import { mensagemDeErro } from "@/services/api";

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const { cores } = useTema();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Devolve a mensagem do primeiro problema encontrado, ou null se está tudo certo.
  function validar(): string | null {
    if (!nome.trim() || !email.trim() || !senha) return "Preencha todos os campos.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Digite um e-mail válido.";
    if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
    if (senha !== confirmar) return "As senhas não conferem.";
    return null;
  }

  async function handleCadastro() {
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }

    setErro("");
    setCarregando(true);
    try {
      await cadastrar(nome.trim(), email.trim().toLowerCase(), senha);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível criar a conta."));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaFormulario>
      <View style={styles.form}>
        <Campo rotulo="Nome" placeholder="Como devemos te chamar?" value={nome} onChangeText={setNome} autoComplete="name" />
        <Campo
          rotulo="E-mail"
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Campo rotulo="Senha" placeholder="Mínimo de 6 caracteres" value={senha} onChangeText={setSenha} secureTextEntry />
        <Campo
          rotulo="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          onSubmitEditing={handleCadastro}
        />

        {erro ? <Text style={[styles.erro, { color: cores.erro }]}>{erro}</Text> : null}

        <View style={styles.botao}>
          <Botao titulo="Criar conta" onPress={handleCadastro} carregando={carregando} />
        </View>
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
  erro: {
    marginBottom: 12,
    textAlign: "center",
  },
  botao: {
    width: "100%",
    marginTop: 8,
  },
});
