// context/ReceitasContext.tsx
// Guarda a lista de receitas do usuário (recentes e favoritas saem dela).
// Assim a Home, a tela de detalhe, os Favoritos e os Recentes enxergam
// sempre os mesmos dados, sem precisar buscar tudo de novo a cada tela.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/services/api";
import type { Receita } from "@/types";
import { useAuth } from "./AuthContext";

interface ReceitasValor {
  receitas: Receita[];
  carregando: boolean;
  recarregar(): Promise<void>;
  buscarReceita(ingredientes: string[], estilo?: string): Promise<Receita>;
  alternarFavorito(id: number): Promise<void>;
}

const ReceitasContext = createContext<ReceitasValor | null>(null);

export function ReceitasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const logado = usuario !== null;

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregando, setCarregando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      setReceitas(await api.listarReceitas());
    } catch {
      // Falhou? Mantém a lista que já estava na tela.
    } finally {
      setCarregando(false);
    }
  }, []);

  // Entrou na conta? Carrega o histórico. Saiu? Limpa a lista.
  useEffect(() => {
    if (logado) recarregar();
    else setReceitas([]);
  }, [logado, recarregar]);

  async function buscarReceita(ingredientes: string[], estilo?: string) {
    const nova = await api.buscarReceita(ingredientes, estilo);
    setReceitas((lista) => [nova, ...lista]);
    return nova;
  }

  async function alternarFavorito(id: number) {
    const atual = receitas.find((r) => r.id === id);
    if (!atual) return;
    const atualizada = await api.definirFavorito(id, !atual.favorito);
    setReceitas((lista) => lista.map((r) => (r.id === id ? atualizada : r)));
  }

  return (
    <ReceitasContext.Provider value={{ receitas, carregando, recarregar, buscarReceita, alternarFavorito }}>
      {children}
    </ReceitasContext.Provider>
  );
}

export function useReceitas() {
  const contexto = useContext(ReceitasContext);
  if (!contexto) throw new Error("useReceitas precisa estar dentro de <ReceitasProvider>");
  return contexto;
}
