-- Migration: Adicionar campos de rastreamento de vistorias realizadas
-- Data: 2025-01-16

-- Adicionar campos para rastrear vistorias realizadas
ALTER TABLE saved_terms
ADD COLUMN IF NOT EXISTS teve_vistoria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS teve_revistoria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_vistoria TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_revistoria TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vistoria_id UUID REFERENCES vistoria_analises(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS revistoria_id UUID REFERENCES vistoria_analises(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_saved_terms_teve_vistoria ON saved_terms(teve_vistoria);
CREATE INDEX IF NOT EXISTS idx_saved_terms_teve_revistoria ON saved_terms(teve_revistoria);
CREATE INDEX IF NOT EXISTS idx_saved_terms_vistoria_id ON saved_terms(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_saved_terms_revistoria_id ON saved_terms(revistoria_id);

-- Função para atualizar status de vistoria no contrato
CREATE OR REPLACE FUNCTION update_contract_vistoria_status()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_vistoria TEXT;
  v_contract_id UUID;
  v_data_vistoria TEXT;
BEGIN
  -- Obter dados da vistoria
  v_contract_id := NEW.contract_id;
  
  IF v_contract_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obter tipo de vistoria dos dados_vistoria
  IF NEW.dados_vistoria IS NOT NULL THEN
    v_tipo_vistoria := NEW.dados_vistoria->>'tipoVistoria';
    v_data_vistoria := NEW.dados_vistoria->>'dataVistoria';
  END IF;
  
  -- Se não tiver tipoVistoria nos dados_vistoria, tentar inferir do título
  IF v_tipo_vistoria IS NULL OR v_tipo_vistoria = '' THEN
    IF NEW.title ILIKE '%revistoria%' THEN
      v_tipo_vistoria := 'revistoria';
    ELSIF NEW.title ILIKE '%final%' THEN
      v_tipo_vistoria := 'final';
    ELSIF NEW.title ILIKE '%inicial%' THEN
      v_tipo_vistoria := 'inicial';
    ELSIF NEW.title ILIKE '%vistoria%' THEN
      v_tipo_vistoria := 'vistoria';
    END IF;
  END IF;
  
  -- Atualizar o contrato baseado no tipo de vistoria
  IF v_tipo_vistoria IN ('revistoria', 'final') THEN
    -- Marcar como teve revistoria
    UPDATE saved_terms
    SET 
      teve_revistoria = true,
      data_revistoria = CASE 
        WHEN v_data_vistoria IS NOT NULL AND v_data_vistoria != '' THEN
          CASE 
            WHEN v_data_vistoria ~ '^\d{4}-\d{2}-\d{2}' THEN v_data_vistoria::timestamptz
            ELSE NULL
          END
        ELSE NOW()
      END,
      revistoria_id = NEW.id,
      updated_at = NOW()
    WHERE id = v_contract_id;
  ELSIF v_tipo_vistoria IN ('vistoria', 'inicial') THEN
    -- Marcar como teve vistoria
    UPDATE saved_terms
    SET 
      teve_vistoria = true,
      data_vistoria = CASE 
        WHEN v_data_vistoria IS NOT NULL AND v_data_vistoria != '' THEN
          CASE 
            WHEN v_data_vistoria ~ '^\d{4}-\d{2}-\d{2}' THEN v_data_vistoria::timestamptz
            ELSE NULL
          END
        ELSE NOW()
      END,
      vistoria_id = NEW.id,
      updated_at = NOW()
    WHERE id = v_contract_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, apenas logar e continuar (não quebrar o insert/update da vistoria)
    RAISE WARNING 'Erro ao atualizar status de vistoria no contrato %: %', v_contract_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status quando vistoria é criada ou atualizada
CREATE TRIGGER trigger_update_contract_vistoria_status
  AFTER INSERT OR UPDATE OF dados_vistoria, contract_id ON vistoria_analises
  FOR EACH ROW
  WHEN (NEW.contract_id IS NOT NULL AND NEW.dados_vistoria IS NOT NULL)
  EXECUTE FUNCTION update_contract_vistoria_status();

-- Comentários para documentação
COMMENT ON COLUMN saved_terms.teve_vistoria IS 'Indica se o contrato já teve uma vistoria realizada';
COMMENT ON COLUMN saved_terms.teve_revistoria IS 'Indica se o contrato já teve uma revistoria realizada';
COMMENT ON COLUMN saved_terms.data_vistoria IS 'Data em que a vistoria foi realizada';
COMMENT ON COLUMN saved_terms.data_revistoria IS 'Data em que a revistoria foi realizada';
COMMENT ON COLUMN saved_terms.vistoria_id IS 'ID da análise de vistoria realizada';
COMMENT ON COLUMN saved_terms.revistoria_id IS 'ID da análise de revistoria realizada';

