import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Conta, Usuario } from "@radar-sebrae/shared";
import { authApi } from "../api/client";
import { clearToken, getToken, setToken as salvarToken } from "../api/authToken";

interface AuthContextValue {
  usuario: Usuario | null;
  conta: Conta | null;
  carregando: boolean;
  login: (token: string, usuario: Usuario, conta: Conta) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setCarregando(false);
      return;
    }
    authApi
      .me()
      .then((r) => {
        setUsuario(r.usuario);
        setConta(r.conta);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setCarregando(false));
  }, []);

  function login(token: string, usuario: Usuario, conta: Conta) {
    salvarToken(token);
    setUsuario(usuario);
    setConta(conta);
  }

  function logout() {
    clearToken();
    setUsuario(null);
    setConta(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, conta, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return ctx;
}
