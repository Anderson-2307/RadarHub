-- ==========================================================
-- RADAR SEBRAE - ESTRUTURA INICIAL
-- PostgreSQL
-- ==========================================================

-- =============================
-- EXTENSÃO UUID
-- =============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- DROP (ORDEM CORRETA)
-- =============================
DROP TABLE IF EXISTS avaliacao_indicador CASCADE;
DROP TABLE IF EXISTS avaliacao CASCADE;
DROP TABLE IF EXISTS indicador CASCADE;
DROP TABLE IF EXISTS cidade CASCADE;
DROP TABLE IF EXISTS estado CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- ==========================================================
-- TABELA: USUARIO
-- ==========================================================
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL, -- ADMIN, RH, CONSULTA
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuario_email ON usuario(email);

-- ==========================================================
-- TABELA: ESTADO
-- ==========================================================
CREATE TABLE estado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- ==========================================================
-- TABELA: CIDADE
-- ==========================================================
CREATE TABLE cidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    estado_id UUID NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_cidade_estado
        FOREIGN KEY (estado_id)
        REFERENCES estado(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_cidade_estado ON cidade(estado_id);

-- ==========================================================
-- TABELA: INDICADOR
-- ==========================================================
CREATE TABLE indicador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    ordem INT NOT NULL,
    peso NUMERIC(5,2) DEFAULT 1.0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_indicador_ativo ON indicador(ativo);
CREATE INDEX idx_indicador_ordem ON indicador(ordem);

-- ==========================================================
-- TABELA: AVALIACAO
-- ==========================================================
CREATE TABLE avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cidade_id UUID NOT NULL,
    data_avaliacao DATE NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    observacao TEXT,
    data_criacao TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_avaliacao_cidade
        FOREIGN KEY (cidade_id)
        REFERENCES cidade(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_avaliacao_cidade ON avaliacao(cidade_id);
CREATE INDEX idx_avaliacao_periodo ON avaliacao(periodo_inicio, periodo_fim);

-- ==========================================================
-- TABELA: AVALIACAO_INDICADOR
-- ==========================================================
CREATE TABLE avaliacao_indicador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avaliacao_id UUID NOT NULL,
    indicador_id UUID NOT NULL,
    nota NUMERIC(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),

    CONSTRAINT fk_ai_avaliacao
        FOREIGN KEY (avaliacao_id)
        REFERENCES avaliacao(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ai_indicador
        FOREIGN KEY (indicador_id)
        REFERENCES indicador(id)
        ON DELETE RESTRICT,

    CONSTRAINT uk_avaliacao_indicador
        UNIQUE (avaliacao_id, indicador_id)
);

CREATE INDEX idx_ai_avaliacao ON avaliacao_indicador(avaliacao_id);
CREATE INDEX idx_ai_indicador ON avaliacao_indicador(indicador_id);

-- ==========================================================
-- DADOS INICIAIS (OPCIONAL - ESTADOS BRASIL)
-- ==========================================================
INSERT INTO estado (nome, uf) VALUES
('Acre','AC'),
('Alagoas','AL'),
('Amapá','AP'),
('Amazonas','AM'),
('Bahia','BA'),
('Ceará','CE'),
('Distrito Federal','DF'),
('Espírito Santo','ES'),
('Goiás','GO'),
('Maranhão','MA'),
('Mato Grosso','MT'),
('Mato Grosso do Sul','MS'),
('Minas Gerais','MG'),
('Pará','PA'),
('Paraíba','PB'),
('Paraná','PR'),
('Pernambuco','PE'),
('Piauí','PI'),
('Rio de Janeiro','RJ'),
('Rio Grande do Norte','RN'),
('Rio Grande do Sul','RS'),
('Rondônia','RO'),
('Roraima','RR'),
('Santa Catarina','SC'),
('São Paulo','SP'),
('Sergipe','SE'),
('Tocantins','TO');

-- ==========================================================
-- FIM DO SCRIPT
-- ==========================================================