// context/AuthContext.tsx
// Guarda quem está logado. Também salva a sessão no celular (AsyncStorage)
// para o usuário não precisar fazer login toda vez que abrir o app.
//
// Nota de segurança: AsyncStorage é simples e ótimo para aprender. Em um app
// publicado, o ideal é guardar o token no expo-secure-store (armazenamento
// criptografado).

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, definirToken } from "@/services/api";
import { definirAoSessaoExpirar } from "@/services/sessao";
import type { DadosPerfil, RespostaAuth } from "@/types";

const CHAVE = "@sobrouisso:sessao";

interface AuthValor {
  usuario: RespostaAuth["usuario"] | null;
  carregando: boolean; // true enquanto lê a sessão salva ao abrir o app
  entrar(email: string, senha: string): Promise<void>;
  cadastrar(nome: string, email: string, senha: string): Promise<void>;
  atualizarPerfil(dados: DadosPerfil): Promise<void>;
  sair(): Promise<void>;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<RespostaAuth | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o app: existe uma sessão salva? Se sim, já entra logado.
  useEffect(() => {
    async function restaurarSessao() {
      try {
        const salva = await AsyncStorage.getItem(CHAVE);
        if (salva) {
          const dados: RespostaAuth = JSON.parse(salva);
          definirToken(dados.token);
          setSessao(dados);
        }
      } catch {
        // sessão ilegível: segue como deslogado
      } finally {
        setCarregando(false);
      }
    }
    restaurarSessao();
  }, []);

  // Se o servidor disser que o token não vale mais (expirou, ou a conta foi
  // apagada), desloga na hora em vez de deixar o app "meio logado".
  useEffect(() => {
    definirAoSessaoExpirar(() => {
      definirToken(null);
      setSessao(null);
      AsyncStorage.removeItem(CHAVE).catch(() => {});
    });
  }, []);

  async function iniciarSessao(dados: RespostaAuth) {
    definirToken(dados.token);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(dados));
    setSessao(dados);
  }

  async function entrar(email: string, senha: string) {
    await iniciarSessao(await api.login(email, senha));
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    await iniciarSessao(await api.cadastrar(nome, email, senha));
  }

  async function atualizarPerfil(dados: DadosPerfil) {
    if (!sessao) return;
    const usuario = await api.atualizarPerfil(dados);
    await iniciarSessao({ token: sessao.token, usuario });
  }

  async function sair() {
    // Primeiro limpamos o login na memória: é isso que faz o app voltar
    // para a tela de entrada na hora, mesmo que o armazenamento falhe.
    definirToken(null);
    setSessao(null);
    // Depois apagamos a sessão salva no celular, para ela não voltar
    // na próxima vez que o app abrir.
    await AsyncStorage.removeItem(CHAVE).catch(() => {});
  }

  return (
    <AuthContext.Provider
      value={{ usuario: sessao?.usuario ?? null, carregando, entrar, cadastrar, atualizarPerfil, sair }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return contexto;
}
