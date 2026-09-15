-- ==========================================================
-- RADAR SEBRAE - ESTRUTURA INICIAL (v1, sem autenticação)
-- PostgreSQL
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- TABELA: ESTADO
-- ==========================================================
CREATE TABLE IF NOT EXISTS estado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL UNIQUE
);

-- ==========================================================
-- TABELA: CIDADE
-- ==========================================================
CREATE TABLE IF NOT EXISTS cidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    estado_id UUID NOT NULL REFERENCES estado(id) ON DELETE RESTRICT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (nome, estado_id)
);

CREATE INDEX IF NOT EXISTS idx_cidade_estado ON cidade(estado_id);

-- ==========================================================
-- TABELA: INDICADOR (totalmente cadastrável)
-- ==========================================================
CREATE TABLE IF NOT EXISTS indicador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    ordem INT NOT NULL DEFAULT 0,
    peso NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indicador_ativo ON indicador(ativo);
CREATE INDEX IF NOT EXISTS idx_indicador_ordem ON indicador(ordem);

-- ==========================================================
-- TABELA: AVALIACAO
-- ==========================================================
CREATE TABLE IF NOT EXISTS avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cidade_id UUID NOT NULL REFERENCES cidade(id) ON DELETE CASCADE,
    data_avaliacao DATE NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    observacao TEXT,
    data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (periodo_fim >= periodo_inicio)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_cidade ON avaliacao(cidade_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_periodo ON avaliacao(periodo_inicio, periodo_fim);

-- ==========================================================
-- TABELA: AVALIACAO_INDICADOR
-- (indicadores usados na avaliação ficam registrados aqui,
--  preservando o histórico mesmo se o indicador for desativado depois)
-- ==========================================================
CREATE TABLE IF NOT EXISTS avaliacao_indicador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avaliacao_id UUID NOT NULL REFERENCES avaliacao(id) ON DELETE CASCADE,
    indicador_id UUID NOT NULL REFERENCES indicador(id) ON DELETE RESTRICT,
    nota NUMERIC(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),
    UNIQUE (avaliacao_id, indicador_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_avaliacao ON avaliacao_indicador(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_ai_indicador ON avaliacao_indicador(indicador_id);

-- ==========================================================
-- DADOS INICIAIS: ESTADOS DO BRASIL
-- ==========================================================
INSERT INTO estado (nome, uf) VALUES
('Acre','AC'),('Alagoas','AL'),('Amapá','AP'),('Amazonas','AM'),('Bahia','BA'),
('Ceará','CE'),('Distrito Federal','DF'),('Espírito Santo','ES'),('Goiás','GO'),
('Maranhão','MA'),('Mato Grosso','MT'),('Mato Grosso do Sul','MS'),('Minas Gerais','MG'),
('Pará','PA'),('Paraíba','PB'),('Paraná','PR'),('Pernambuco','PE'),('Piauí','PI'),
('Rio de Janeiro','RJ'),('Rio Grande do Norte','RN'),('Rio Grande do Sul','RS'),
('Rondônia','RO'),('Roraima','RR'),('Santa Catarina','SC'),('São Paulo','SP'),
('Sergipe','SE'),('Tocantins','TO')
ON CONFLICT (uf) DO NOTHING;

-- ==========================================================
-- INDICADORES PADRÃO (podem ser editados/desativados depois)
-- Só semeia se a tabela ainda estiver vazia (migration é reexecutada
-- a cada start do container).
-- ==========================================================
INSERT INTO indicador (nome, descricao, ordem, peso)
SELECT * FROM (VALUES
    ('Gestão Municipal', NULL::text, 1, 1.0),
    ('Lideranças Locais', NULL, 2, 1.0),
    ('Desburocratização', NULL, 3, 1.0),
    ('Sala do Empreendedor', NULL, 4, 1.0),
    ('Compras Governamentais', NULL, 5, 1.0),
    ('Educação Empreendedora', NULL, 6, 1.0),
    ('Inclusão Socioprodutiva', NULL, 7, 1.0),
    ('Marketing Territorial', NULL, 8, 1.0),
    ('Cooperativismo e Crédito', NULL, 9, 1.0),
    ('Inovação e Sustentabilidade', NULL, 10, 1.0)
) AS seed(nome, descricao, ordem, peso)
WHERE NOT EXISTS (SELECT 1 FROM indicador);
