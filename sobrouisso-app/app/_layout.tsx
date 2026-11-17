// app/_layout.tsx
// Layout RAIZ: envolve o app inteiro e decide quais telas o usuário pode ver.
//
// Regra do app:
//   - deslogado -> só enxerga Login e Cadastro
//   - logado    -> só enxerga as abas (Início, Favoritos...) e o detalhe da receita
// O <Stack.Protected> faz esse controle e redireciona sozinho quando o usuário
// entra ou sai (o "redirectTo" diz para onde ele é levado); por isso as telas de login/config nem precisam chamar router.push
// depois de entrar ou sair.

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { useEffect, type ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Logo } from "@/components/Logo";
import { fontes } from "@/constants/fontes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReceitasProvider } from "@/context/ReceitasContext";
import { TemaProvider, useTema } from "@/context/TemaContext";

// Mantém a tela de abertura visível até sabermos se existe sessão salva
// e até as fontes terminarem de carregar.
SplashScreen.preventAutoHideAsync();

function Rotas() {
  const { usuario, carregando } = useAuth();
  const { cores, tema } = useTema();

  // useFonts baixa/carrega as fontes e avisa quando estão prontas.
  const [fontesProntas, erroFontes] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Se as fontes falharem, seguimos com a fonte padrão em vez de travar o app.
  const pronto = !carregando && (fontesProntas || erroFontes !== null);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  const logado = usuario !== null;

  return (
    <>
      <StatusBar style={tema === "escuro" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.texto,
          headerShadowVisible: false, // tira a linha embaixo do cabeçalho
          headerTitleAlign: "center",
          headerTitleStyle: { fontFamily: fontes.extrabold, color: cores.verde },
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Protected guard={!logado} redirectTo="/home">
          <Stack.Screen name="index" />
          <Stack.Screen name="cadastro" options={{ headerShown: true, title: "Criar conta" }} />
        </Stack.Protected>

        <Stack.Protected guard={logado} redirectTo="/">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="receita/[id]"
            options={{
              headerShown: true,
              headerBackButtonDisplayMode: "minimal", // só a setinha, sem texto
              headerTitle: () => <Logo tamanho="pequeno" comIcone={false} />,
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

// Recria o ReceitasProvider sempre que o usuário muda (entrar/sair).
// Mudar a "key" faz o React descartar o estado antigo e começar do zero,
// assim as receitas de um usuário nunca aparecem para outro.
function ReceitasPorUsuario({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  return <ReceitasProvider key={usuario?.id ?? "anonimo"}>{children}</ReceitasProvider>;
}

// A ordem importa: o Receitas usa o Auth, e ambos usam o Tema.
export default function RootLayout() {
  return (
    <TemaProvider>
      <AuthProvider>
        <ReceitasPorUsuario>
          <Rotas />
        </ReceitasPorUsuario>
      </AuthProvider>
    </TemaProvider>
  );
}
