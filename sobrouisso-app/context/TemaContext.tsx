// context/TemaContext.tsx
// Context = uma "caixa" de dados que qualquer tela consegue ler sem precisar
// passar props de componente em componente. Aqui a caixa guarda o tema.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { temas, type Cores, type NomeTema } from "@/constants/temas";

const CHAVE = "@sobrouisso:tema";

interface TemaValor {
  tema: NomeTema;
  cores: Cores;
  definirTema(novo: NomeTema): Promise<void>;
}

const TemaContext = createContext<TemaValor | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const temaDoSistema = useColorScheme(); // "light" | "dark" | null
  const [escolhido, setEscolhido] = useState<NomeTema | null>(null);

  // Ao abrir o app, recupera o tema que o usuário escolheu da última vez.
  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then((valor) => {
        if (valor === "claro" || valor === "escuro") setEscolhido(valor);
      })
      .catch(() => {});
  }, []);

  // Sem escolha salva, segue o tema do celular.
  const tema: NomeTema = escolhido ?? (temaDoSistema === "dark" ? "escuro" : "claro");

  async function definirTema(novo: NomeTema) {
    setEscolhido(novo);
    await AsyncStorage.setItem(CHAVE, novo).catch(() => {});
  }

  return (
    <TemaContext.Provider value={{ tema, cores: temas[tema], definirTema }}>
      {children}
    </TemaContext.Provider>
  );
}

// Hook = atalho para ler a caixa. Nas telas basta: const { cores } = useTema();
export function useTema() {
  const contexto = useContext(TemaContext);
  if (!contexto) throw new Error("useTema precisa estar dentro de <TemaProvider>");
  return contexto;
}
