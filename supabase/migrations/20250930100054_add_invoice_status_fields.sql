/*
  # Adicionar campos de status e gestão de faturas

  1. Novos Campos
    - `status` (text, NOT NULL, default 'pendente')
      - Valores permitidos: 'pendente', 'pago', 'vencido'
      - Define o estado atual da fatura
    - `data_vencimento` (date, nullable)
      - Data de vencimento da fatura
      - Usado para calcular faturas vencidas
    - `data_pagamento` (timestamptz, nullable)
      - Data e hora do pagamento
      - Preenchido quando status = 'pago'

  2. Validações
    - CHECK constraint para garantir apenas valores válidos de status
    - Faturas existentes recebem status 'pendente' automaticamente

  3. Índices
    - Índice em status para otimizar filtros
    - Índice em data_vencimento para identificar faturas vencidas

  4. Segurança
    - Não altera políticas RLS existentes
    - Compatível com dados existentes
*/

-- Adicionar campos de status e datas
ALTER TABLE fin_facture_achat
  ADD COLUMN status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'vencido')),
  ADD COLUMN data_vencimento date,
  ADD COLUMN data_pagamento timestamptz;

-- Criar índices para otimizar consultas por status e vencimento
CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_status
  ON fin_facture_achat(status);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_data_vencimento
  ON fin_facture_achat(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_fin_facture_achat_data_pagamento
  ON fin_facture_achat(data_pagamento);

-- Comentários para documentação
COMMENT ON COLUMN fin_facture_achat.status IS 'Status da fatura: pendente, pago ou vencido';
COMMENT ON COLUMN fin_facture_achat.data_vencimento IS 'Data de vencimento da fatura';
COMMENT ON COLUMN fin_facture_achat.data_pagamento IS 'Data e hora em que a fatura foi paga';