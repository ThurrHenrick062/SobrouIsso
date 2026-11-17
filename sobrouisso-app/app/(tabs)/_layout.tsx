// app/(tabs)/_layout.tsx
// Barra de abas inferior. A pasta "(tabs)" entre parênteses é só um GRUPO:
// ela organiza os arquivos mas NÃO aparece no endereço. Então
// app/(tabs)/home.tsx vira a rota "/home".

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { fontes } from "@/constants/fontes";
import { useTema } from "@/context/TemaContext";

export default function TabsLayout() {
  const { cores } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.fundo },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitleStyle: { fontFamily: fontes.extrabold, color: cores.verde },
        sceneStyle: { backgroundColor: cores.fundo },
        tabBarStyle: { backgroundColor: cores.fundo, borderTopColor: cores.borda },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontFamily: fontes.semibold },
      }}
    >
      {/* A primeira aba declarada é a que abre por padrão. */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          headerShown: false, // a Home mostra o logo no próprio conteúdo
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="recentes"
        options={{
          title: "Recentes",
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: "Configurações",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
