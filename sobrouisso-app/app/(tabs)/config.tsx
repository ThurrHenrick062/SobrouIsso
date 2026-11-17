// app/(tabs)/config.tsx  ->  CONFIGURAÇÕES (rota "/config")
// Três blocos: dados da conta, aparência (tema) e sair.

import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Botao } from "@/components/Botao";
import { Campo } from "@/components/Campo";
import { TelaFormulario } from "@/components/TelaFormulario";
import { fontes } from "@/constants/fontes";
import { useAuth } from "@/context/AuthContext";
import { useTema } from "@/context/TemaContext";
import { mensagemDeErro } from "@/services/api";
import { avisar, confirmar } from "@/services/dialogos";

export default function Config() {
  const { usuario, atualizarPerfil, sair } = useAuth();
  const { tema, cores, definirTema } = useTema();

  // Os campos já começam preenchidos com os dados atuais do usuário.
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim() || !email.trim()) {
      avisar("Campos obrigatórios", "Nome e e-mail não podem ficar vazios.");
      return;
    }
    if (senha && senha.length < 6) {
      avisar("Senha curta", "A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setSalvando(true);
    try {
      await atualizarPerfil({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha || undefined, // vazio = não troca a senha
      });
      setSenha("");
      avisar("Pronto!", "Seus dados foram atualizados.");
    } catch (e) {
      avisar("Ops!", mensagemDeErro(e, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

    async function confirmarSaida() {
    const querSair = await confirmar("Sair da conta", "Deseja realmente sair?", "Sair");
    if (querSair) await sair();
  }

  return (
    <TelaFormulario centralizar={false}>
      <View style={styles.conteudo}>
        <Text style={[styles.secao, { color: cores.texto }]}>Meus dados</Text>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo
          rotulo="Nova senha (opcional)"
          placeholder="Deixe em branco para manter a atual"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <Botao titulo="Salvar alterações" onPress={salvar} carregando={salvando} />

        <Text style={[styles.secao, styles.espaco, { color: cores.texto }]}>Aparência</Text>
        <View style={styles.linha}>
          <Text style={{ color: cores.texto, fontSize: 16, fontFamily: fontes.semibold }}>Tema escuro</Text>
          <Switch
            value={tema === "escuro"}
            onValueChange={(ligado) => definirTema(ligado ? "escuro" : "claro")}
            trackColor={{ true: cores.primaria }}
          />
        </View>

        <View style={styles.espaco}>
          <Botao titulo="Sair da conta" variante="perigo" onPress={confirmarSaida} />
        </View>
      </View>
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: "100%",
    maxWidth: 380,
  },
  secao: {
    fontSize: 20,
    fontFamily: fontes.extrabold,
    marginBottom: 14,
  },
  espaco: {
    marginTop: 32,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
