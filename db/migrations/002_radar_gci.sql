-- ==========================================================
-- RADAR SEBRAE - MODELO "RADAR GCI" (Eixo > Dimensão > Indicador)
-- Substitui o modelo plano de indicadores por uma estrutura
-- hierárquica de 3 níveis, com índice geral de 0 a 100.
--
-- ATENÇÃO: esta migration limpa avaliacao_indicador, avaliacao e
-- indicador, pois a escala de nota muda de 0-10 para 1-5 e o
-- indicador passa a exigir uma dimensão. Assume-se que só existem
-- dados de desenvolvimento/demo até aqui.
-- ==========================================================

-- ==========================================================
-- TABELA: EIXO
-- ==========================================================
CREATE TABLE IF NOT EXISTS eixo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    peso NUMERIC(5,4) NOT NULL DEFAULT 0,
    ordem INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- TABELA: DIMENSAO
-- ==========================================================
CREATE TABLE IF NOT EXISTS dimensao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eixo_id UUID NOT NULL REFERENCES eixo(id) ON DELETE RESTRICT,
    nome VARCHAR(150) NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dimensao_eixo ON dimensao(eixo_id);

-- ==========================================================
-- LIMPEZA DO MODELO ANTIGO (nota 0-10, indicador sem dimensão)
-- ==========================================================
DELETE FROM avaliacao_indicador;
DELETE FROM avaliacao;
DELETE FROM indicador;

-- ==========================================================
-- INDICADOR: agora pertence a uma dimensão; nota passa a ser 1-5
-- ==========================================================
ALTER TABLE indicador ADD COLUMN IF NOT EXISTS dimensao_id UUID REFERENCES dimensao(id) ON DELETE RESTRICT;

DO $$
BEGIN
    ALTER TABLE avaliacao_indicador DROP CONSTRAINT IF EXISTS avaliacao_indicador_nota_check;
    ALTER TABLE avaliacao_indicador ADD CONSTRAINT avaliacao_indicador_nota_check CHECK (nota >= 1 AND nota <= 5);
END $$;

CREATE INDEX IF NOT EXISTS idx_indicador_dimensao ON indicador(dimensao_id);

-- ==========================================================
-- SEED: 3 EIXOS
-- ==========================================================
INSERT INTO eixo (nome, peso, ordem)
SELECT * FROM (VALUES
    ('Gestão', 0.40, 1),
    ('Competitividade', 0.30, 2),
    ('Inovação', 0.30, 3)
) AS seed(nome, peso, ordem)
WHERE NOT EXISTS (SELECT 1 FROM eixo);

-- ==========================================================
-- SEED: 12 DIMENSÕES (4 por eixo)
-- ==========================================================
INSERT INTO dimensao (eixo_id, nome, ordem)
SELECT e.id, d.nome, d.ordem
FROM (VALUES
    ('Gestão', 'Governança e estratégia', 1),
    ('Gestão', 'Processos e operações', 2),
    ('Gestão', 'Pessoas e cultura', 3),
    ('Gestão', 'Finanças e controladoria', 4),
    ('Competitividade', 'Mercado e clientes', 1),
    ('Competitividade', 'Proposta de valor', 2),
    ('Competitividade', 'Comercial e go-to-market', 3),
    ('Competitividade', 'Produtividade e resultado', 4),
    ('Inovação', 'Liderança e cultura', 1),
    ('Inovação', 'Processo e portfólio', 2),
    ('Inovação', 'Tecnologia e maturidade digital', 3),
    ('Inovação', 'Ecossistema e parcerias', 4)
) AS d(eixo_nome, nome, ordem)
JOIN eixo e ON e.nome = d.eixo_nome
WHERE NOT EXISTS (SELECT 1 FROM dimensao);
