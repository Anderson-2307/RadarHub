import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  async function handleSuccess(credential: string | undefined) {
    if (!credential) {
      setErro("Não foi possível obter as credenciais do Google.");
      return;
    }
    try {
      const resposta = await authApi.google(credential);
      login(resposta.token, resposta.usuario, resposta.conta);
      navigate("/", { replace: true });
    } catch {
      setErro("Não foi possível entrar. Tente novamente.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/radarhub-icon.png" alt="" className="login-icon" />
        <h1>
          RADAR <span>HUB</span>
        </h1>
        <p>Acompanhamento de indicadores administrativos.</p>
        <div className="login-google-btn">
          <GoogleLogin
            onSuccess={(cred) => handleSuccess(cred.credential)}
            onError={() => setErro("Não foi possível entrar com o Google.")}
          />
        </div>
        {erro && <div className="error-msg">{erro}</div>}
      </div>
    </div>
  );
}
