-- ==========================================================
-- RADAR HUB - MULTI-TENANT + LOGIN COM GOOGLE
-- Introduz conta (tenant) e usuario, e isola todos os dados
-- de domínio (cidade, eixo, dimensao, indicador, avaliacao)
-- por conta_id.
-- ==========================================================

-- ==========================================================
-- TABELA: CONTA (tenant)
-- ==========================================================
CREATE TABLE IF NOT EXISTS conta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- TABELA: USUARIO
-- ==========================================================
CREATE TABLE IF NOT EXISTS usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conta_id UUID NOT NULL REFERENCES conta(id) ON DELETE CASCADE,
    google_sub VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    papel VARCHAR(30) NOT NULL DEFAULT 'admin',
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_conta ON usuario(conta_id);

-- ==========================================================
-- CONTA_ID nas tabelas de domínio (denormalizado de propósito:
-- cada tabela filtra direto por conta_id, sem depender de JOIN)
-- ==========================================================
ALTER TABLE cidade ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE CASCADE;
ALTER TABLE eixo ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE CASCADE;
ALTER TABLE dimensao ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE CASCADE;
ALTER TABLE indicador ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE CASCADE;
ALTER TABLE avaliacao ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE CASCADE;

-- ==========================================================
-- BACKFILL: cria a "Conta Demo" com os dados já existentes
-- e o usuário pré-cadastrado (o google_sub é preenchido no
-- primeiro login real, via POST /api/auth/google)
-- ==========================================================
DO $$
DECLARE
    conta_demo_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM conta) THEN
        INSERT INTO conta (nome) VALUES ('Conta Demo') RETURNING id INTO conta_demo_id;

        UPDATE cidade SET conta_id = conta_demo_id WHERE conta_id IS NULL;
        UPDATE eixo SET conta_id = conta_demo_id WHERE conta_id IS NULL;
        UPDATE dimensao SET conta_id = conta_demo_id WHERE conta_id IS NULL;
        UPDATE indicador SET conta_id = conta_demo_id WHERE conta_id IS NULL;
        UPDATE avaliacao SET conta_id = conta_demo_id WHERE conta_id IS NULL;

        INSERT INTO usuario (conta_id, email, nome, papel)
        VALUES (conta_demo_id, 'anderson002@gmail.com', 'Anderson', 'admin')
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- ==========================================================
-- NOT NULL após o backfill
-- ==========================================================
ALTER TABLE cidade ALTER COLUMN conta_id SET NOT NULL;
ALTER TABLE eixo ALTER COLUMN conta_id SET NOT NULL;
ALTER TABLE dimensao ALTER COLUMN conta_id SET NOT NULL;
ALTER TABLE indicador ALTER COLUMN conta_id SET NOT NULL;
ALTER TABLE avaliacao ALTER COLUMN conta_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cidade_conta ON cidade(conta_id);
CREATE INDEX IF NOT EXISTS idx_eixo_conta ON eixo(conta_id);
CREATE INDEX IF NOT EXISTS idx_dimensao_conta ON dimensao(conta_id);
CREATE INDEX IF NOT EXISTS idx_indicador_conta ON indicador(conta_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_conta ON avaliacao(conta_id);
