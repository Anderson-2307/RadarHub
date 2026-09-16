import { useState, type ReactNode } from "react";

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  colapsadoInicial?: boolean;
  style?: React.CSSProperties;
}

export function Painel({ titulo, subtitulo, children, colapsadoInicial = false, style }: Props) {
  const [colapsado, setColapsado] = useState(colapsadoInicial);

  return (
    <div className="card painel" style={style}>
      <button
        type="button"
        className="painel-head"
        onClick={() => setColapsado((v) => !v)}
        aria-expanded={!colapsado}
      >
        <div>
          <h3>{titulo}</h3>
          {subtitulo && <p className="sub">{subtitulo}</p>}
        </div>
        <span className={`painel-toggle-icon${colapsado ? " colapsado" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {!colapsado && <div className="painel-body">{children}</div>}
    </div>
  );
}
