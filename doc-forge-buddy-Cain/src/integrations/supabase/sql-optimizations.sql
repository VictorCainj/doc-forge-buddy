-- SQL Functions Otimizadas para Supabase
-- Este arquivo contém funções SQL otimizadas que podem ser criadas no Supabase
-- para melhorar a performance das queries

-- ============================================================================
-- FUNÇÕES DE OTIMIZAÇÃO DE QUERIES
-- ============================================================================

-- Função para otimizar SELECT com colunas específicas
CREATE OR REPLACE FUNCTION get_optimized_columns(table_name text)
RETURNS text[] AS $$
DECLARE
    columns text[];
BEGIN
    -- Retornar colunas otimizadas baseadas na tabela
    CASE table_name
        WHEN 'contracts' THEN
            columns := ARRAY['id', 'user_id', 'status', 'title', 'created_at', 'updated_at'];
        WHEN 'users' THEN
            columns := ARRAY['id', 'email', 'name', 'avatar_url', 'created_at'];
        WHEN 'vistorias' THEN
            columns := ARRAY['id', 'contract_id', 'status', 'scheduled_at', 'completed_at', 'created_at'];
        WHEN 'prestadores' THEN
            columns := ARRAY['id', 'user_id', 'name', 'specialty', 'rating', 'created_at'];
        ELSE
            columns := ARRAY['id', 'created_at', 'updated_at'];
    END CASE;
    
    RETURN columns;
END;
$$ LANGUAGE plpgsql;

-- Função para contar otimizada
CREATE OR REPLACE FUNCTION count_optimized(table_name text, filter_condition text DEFAULT '1=1')
RETURNS integer AS $$
DECLARE
    result integer;
    query_text text;
BEGIN
    query_text := format('SELECT COUNT(*) FROM %I WHERE %s', table_name, filter_condition);
    
    EXECUTE query_text INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para somar otimizada
CREATE OR REPLACE FUNCTION sum_optimized(
    table_name text,
    sum_column text,
    filter_condition text DEFAULT '1=1'
)
RETURNS numeric AS $$
DECLARE
    result numeric;
    query_text text;
BEGIN
    -- Validar coluna numérica
    IF sum_column !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
        RAISE EXCEPTION 'Invalid column name: %', sum_column;
    END IF;
    
    query_text := format(
        'SELECT COALESCE(SUM(%I), 0) FROM %I WHERE %s',
        sum_column,
        table_name,
        filter_condition
    );
    
    EXECUTE query_text INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para média otimizada
CREATE OR REPLACE FUNCTION avg_optimized(
    table_name text,
    avg_column text,
    filter_condition text DEFAULT '1=1'
)
RETURNS numeric AS $$
DECLARE
    result numeric;
    query_text text;
BEGIN
    -- Validar coluna numérica
    IF avg_column !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
        RAISE EXCEPTION 'Invalid column name: %', avg_column;
    END IF;
    
    query_text := format(
        'SELECT COALESCE(AVG(%I), 0) FROM %I WHERE %s',
        avg_column,
        table_name,
        filter_condition
    );
    
    EXECUTE query_text INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE JOIN OTIMIZADO
-- ============================================================================

-- Função para JOIN otimizado entre vistorias e contratos
CREATE OR REPLACE FUNCTION get_vistorias_with_contracts(
    user_id_filter text DEFAULT NULL,
    status_filter text DEFAULT NULL,
    limit_count integer DEFAULT 100,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    vistoria_id uuid,
    contract_id uuid,
    contract_title text,
    contract_status text,
    vistoria_status text,
    scheduled_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.contract_id,
        c.title as contract_title,
        c.status as contract_status,
        v.status as vistoria_status,
        v.scheduled_at,
        v.completed_at,
        v.created_at
    FROM vistorias v
    JOIN contracts c ON v.contract_id = c.id
    WHERE 
        (user_id_filter IS NULL OR c.user_id = user_id_filter)
        AND (status_filter IS NULL OR v.status = status_filter)
    ORDER BY v.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Função para JOIN otimizado entre prestadores e usuários
CREATE OR REPLACE FUNCTION get_prestadores_with_users(
    specialty_filter text DEFAULT NULL,
    rating_min numeric DEFAULT 0,
    limit_count integer DEFAULT 100
)
RETURNS TABLE(
    prestador_id uuid,
    user_id uuid,
    name text,
    email text,
    specialty text,
    rating numeric,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        u.name,
        u.email,
        p.specialty,
        p.rating,
        p.created_at
    FROM prestadores p
    JOIN users u ON p.user_id = u.id
    WHERE 
        (specialty_filter IS NULL OR p.specialty = specialty_filter)
        AND (p.rating >= rating_min)
    ORDER BY p.rating DESC, p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE GROUP BY OTIMIZADO
-- ============================================================================

-- Função para agrupar contratos por status
CREATE OR REPLACE FUNCTION get_contracts_by_status(user_id_filter text DEFAULT NULL)
RETURNS TABLE(
    status text,
    count bigint,
    percentage numeric
) AS $$
DECLARE
    total_contracts bigint;
BEGIN
    -- Contar total primeiro
    SELECT COUNT(*) INTO total_contracts
    FROM contracts
    WHERE (user_id_filter IS NULL OR user_id = user_id_filter);
    
    RETURN QUERY
    SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / total_contracts)::numeric, 2) as percentage
    FROM contracts
    WHERE (user_id_filter IS NULL OR user_id = user_id_filter)
    GROUP BY status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para agrupar vistorias por mês
CREATE OR REPLACE FUNCTION get_vistorias_by_month(
    year_filter integer DEFAULT EXTRACT(year FROM NOW()),
    user_id_filter text DEFAULT NULL
)
RETURNS TABLE(
    month_number integer,
    month_name text,
    total_count bigint,
    completed_count bigint,
    pending_count bigint,
    average_rating numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(month FROM v.created_at)::integer as month_number,
        TO_CHAR(v.created_at, 'Month') as month_name,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE v.status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE v.status = 'pending') as pending_count,
        ROUND(AVG(v.rating)::numeric, 2) as average_rating
    FROM vistorias v
    JOIN contracts c ON v.contract_id = c.id
    WHERE 
        EXTRACT(year FROM v.created_at) = year_filter
        AND (user_id_filter IS NULL OR c.user_id = user_id_filter)
    GROUP BY EXTRACT(month FROM v.created_at), TO_CHAR(v.created_at, 'Month')
    ORDER BY month_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE PAGINAÇÃO OTIMIZADA
-- ============================================================================

-- Função para keyset pagination
CREATE OR REPLACE FUNCTION get_contracts_keyset_pagination(
    user_id_filter text,
    cursor_created_at timestamptz DEFAULT '1970-01-01'::timestamptz,
    cursor_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    limit_count integer DEFAULT 20
)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    status text,
    title text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.status,
        c.title,
        c.created_at,
        c.updated_at
    FROM contracts c
    WHERE 
        c.user_id = user_id_filter
        AND (
            c.created_at < cursor_created_at 
            OR (c.created_at = cursor_created_at AND c.id > cursor_id)
        )
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Função para busca com ranking
CREATE OR REPLACE FUNCTION search_contracts_ranked(
    search_term text,
    user_id_filter text DEFAULT NULL,
    limit_count integer DEFAULT 50
)
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    status text,
    created_at timestamptz,
    rank numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.created_at,
        -- Ranking baseado em relevância
        (
            CASE 
                WHEN c.title ILIKE '%' || search_term || '%' THEN 100
                ELSE 0
            END +
            CASE 
                WHEN c.description ILIKE '%' || search_term || '%' THEN 50
                ELSE 0
            END +
            CASE 
                WHEN c.tags && ARRAY[search_term] THEN 75
                ELSE 0
            END
        )::numeric as rank
    FROM contracts c
    WHERE 
        (user_id_filter IS NULL OR c.user_id = user_id_filter)
        AND (
            c.title ILIKE '%' || search_term || '%'
            OR c.description ILIKE '%' || search_term || '%'
            OR c.tags && ARRAY[search_term]
        )
    ORDER BY rank DESC, c.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE TRANSAÇÃO
-- ============================================================================

-- Função para executar transações com rollback automático
CREATE OR REPLACE FUNCTION execute_transaction(
    operations jsonb
)
RETURNS jsonb AS $$
DECLARE
    operation jsonb;
    results jsonb := '[]'::jsonb;
    result jsonb;
    op_type text;
    op_table text;
    op_data jsonb;
    op_where jsonb;
    query_result record;
    success boolean := true;
BEGIN
    -- Processar cada operação
    FOR operation IN SELECT * FROM jsonb_array_elements(operations)
    LOOP
        op_type := operation->>'type';
        op_table := operation->>'table';
        op_data := operation->'data';
        op_where := operation->'where';
        
        BEGIN
            CASE op_type
                WHEN 'insert' THEN
                    EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, %L)', 
                                 op_table, op_table, op_data) INTO query_result;
                    result := jsonb_build_object('success', true, 'type', op_type, 'table', op_table);
                    
                WHEN 'update' THEN
                    EXECUTE format('UPDATE %I SET %s WHERE %s', 
                                 op_table, 
                                 (SELECT string_agg(format('%I = %L', key, value), ', ') 
                                  FROM jsonb_each_text(op_data)),
                                 (SELECT string_agg(format('%I = %L', key, value), ' AND ') 
                                  FROM jsonb_each_text(op_where)));
                    result := jsonb_build_object('success', true, 'type', op_type, 'table', op_table);
                    
                WHEN 'delete' THEN
                    EXECUTE format('DELETE FROM %I WHERE %s', 
                                 op_table,
                                 (SELECT string_agg(format('%I = %L', key, value), ' AND ') 
                                  FROM jsonb_each_text(op_where)));
                    result := jsonb_build_object('success', true, 'type', op_type, 'table', op_table);
                    
                ELSE
                    RAISE EXCEPTION 'Unknown operation type: %', op_type;
            END CASE;
            
            results := results || result;
            
        EXCEPTION WHEN OTHERS THEN
            success := false;
            result := jsonb_build_object(
                'success', false, 
                'type', op_type, 
                'table', op_table, 
                'error', SQLERRM
            );
            results := results || result;
        END;
    END LOOP;
    
    IF NOT success THEN
        RAISE EXCEPTION 'Transaction failed';
    END IF;
    
    RETURN jsonb_build_object('success', true, 'results', results);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE CACHE E PERFORMANCE
-- ============================================================================

-- Função para invalidar cache por padrão
CREATE OR REPLACE FUNCTION invalidate_cache_pattern(
    pattern text,
    table_name text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
    cleared_count integer := 0;
BEGIN
    -- Esta função seria implementada na aplicação
    -- pois invalidação de cache acontece no lado do cliente
    -- Aqui apenas registramos o evento
    
    INSERT INTO audit_log (event_type, pattern, table_name, created_at)
    VALUES ('cache_invalidation', pattern, table_name, NOW());
    
    RETURN cleared_count;
END;
$$ LANGUAGE plpgsql;

-- Função para coletar estatísticas de performance
CREATE OR REPLACE FUNCTION get_query_performance_stats(
    time_range_hours integer DEFAULT 24
)
RETURNS TABLE(
    table_name text,
    query_type text,
    count bigint,
    avg_duration numeric,
    min_duration numeric,
    max_duration numeric,
    p95_duration numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        table_name,
        query_type,
        COUNT(*) as count,
        ROUND(AVG(duration_ms)::numeric, 2) as avg_duration,
        MIN(duration_ms) as min_duration,
        MAX(duration_ms) as max_duration,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration
    FROM query_performance_log
    WHERE created_at >= NOW() - (time_range_hours || ' hours')::interval
    GROUP BY table_name, query_type
    ORDER BY avg_duration DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÕES DE SEGURANÇA E RLS
-- ============================================================================

-- Função para aplicar RLS policies automaticamente
CREATE OR REPLACE FUNCTION apply_rls_policies(
    table_name text,
    user_id text DEFAULT auth.uid()::text
)
RETURNS boolean AS $$
DECLARE
    policy_name text;
    policy_sql text;
BEGIN
    -- Políticas baseadas no usuário
    policy_name := format('user_owns_%s', table_name);
    policy_sql := format(
        'CREATE POLICY %I ON %I FOR ALL USING (user_id = %L)',
        policy_name, table_name, user_id
    );
    
    -- Executar política
    EXECUTE policy_sql;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar dados antes da inserção
CREATE OR REPLACE FUNCTION validate_contract_data(
    contract_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    validated_data jsonb;
    errors text[] := ARRAY[]::text[];
BEGIN
    -- Validar campos obrigatórios
    IF contract_data ? 'user_id' IS FALSE THEN
        errors := array_append(errors, 'user_id é obrigatório');
    END IF;
    
    IF contract_data ? 'title' IS FALSE OR length(contract_data->>'title') < 3 THEN
        errors := array_append(errors, 'title deve ter pelo menos 3 caracteres');
    END IF;
    
    IF contract_data ? 'status' IS FALSE OR contract_data->>'status' NOT IN ('active', 'inactive', 'pending') THEN
        errors := array_append(errors, 'status deve ser: active, inactive ou pending');
    END IF;
    
    -- Se há erros, retornar lista
    IF array_length(errors, 1) > 0 THEN
        RAISE EXCEPTION 'Validation errors: %', array_to_string(errors, ', ');
    END IF;
    
    -- Adicionar timestamps
    validated_data := contract_data || jsonb_build_object(
        'created_at', NOW(),
        'updated_at', NOW()
    );
    
    RETURN validated_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÍNDICES OTIMIZADOS
-- ============================================================================

-- Criar índices para melhorar performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_user_status 
ON contracts (user_id, status) 
WHERE status IN ('active', 'pending');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vistorias_contract_status 
ON vistorias (contract_id, status) 
WHERE status IN ('pending', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vistorias_scheduled_at 
ON vistorias (scheduled_at) 
WHERE scheduled_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_created_at 
ON contracts (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users (email) UNIQUE;

-- Índice para busca de texto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_search 
ON contracts USING gin (to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- ============================================================================
-- VIEWS OTIMIZADAS
-- ============================================================================

-- View para dashboard com dados agregados
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    COUNT(c.id) as total_contracts,
    COUNT(c.id) FILTER (WHERE c.status = 'active') as active_contracts,
    COUNT(v.id) as total_vistorias,
    COUNT(v.id) FILTER (WHERE v.status = 'pending') as pending_vistorias,
    COUNT(v.id) FILTER (WHERE v.status = 'completed') as completed_vistorias,
    ROUND(AVG(p.rating)::numeric, 2) as average_prestador_rating,
    MAX(v.created_at) as last_vistoria_date
FROM users u
LEFT JOIN contracts c ON u.id = c.user_id
LEFT JOIN vistorias v ON c.id = v.contract_id
LEFT JOIN prestadores p ON v.prestador_id = p.id
GROUP BY u.id, u.name, u.email;

-- View para relatórios de performance
CREATE OR REPLACE VIEW performance_report AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    table_name,
    query_type,
    COUNT(*) as query_count,
    AVG(duration_ms) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    COUNT(*) FILTER (WHERE status = 'error') as error_count,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*))::numeric, 
        2
    ) as error_rate_percent
FROM query_performance_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), table_name, query_type
ORDER BY hour_bucket DESC;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION get_optimized_columns IS 'Retorna colunas otimizadas para SELECT baseadas na tabela';
COMMENT ON FUNCTION count_optimized IS 'Contagem otimizada com filtro personalizado';
COMMENT ON FUNCTION sum_optimized IS 'Soma otimizada com filtro personalizado';
COMMENT ON FUNCTION avg_optimized IS 'Média otimizada com filtro personalizado';
COMMENT ON FUNCTION get_vistorias_with_contracts IS 'JOIN otimizado entre vistorias e contratos';
COMMENT ON FUNCTION get_prestadores_with_users IS 'JOIN otimizado entre prestadores e usuários';
COMMENT ON FUNCTION get_contracts_by_status IS 'Agrupamento de contratos por status';
COMMENT ON FUNCTION get_vistorias_by_month IS 'Agrupamento de vistorias por mês';
COMMENT ON FUNCTION get_contracts_keyset_pagination IS 'Paginação keyset para contratos';
COMMENT ON FUNCTION search_contracts_ranked IS 'Busca com ranking de relevância';
COMMENT ON FUNCTION execute_transaction IS 'Execução de transação com rollback automático';
COMMENT ON FUNCTION get_query_performance_stats IS 'Estatísticas de performance das queries';
COMMENT ON FUNCTION apply_rls_policies IS 'Aplicação automática de políticas RLS';
COMMENT ON FUNCTION validate_contract_data IS 'Validação de dados de contrato antes da inserção';

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

/*
-- Exemplos de como usar as funções:

-- 1. Query otimizada básica
SELECT * FROM get_contracts_keyset_pagination('user-123', '2023-01-01'::timestamptz, 'uuid-123', 20);

-- 2. JOIN otimizado
SELECT * FROM get_vistorias_with_contracts('user-123', 'pending', 50, 0);

-- 3. Agrupamento otimizado
SELECT * FROM get_contracts_by_status('user-123');

-- 4. Busca com ranking
SELECT * FROM search_contracts_ranked('contrato', 'user-123', 10);

-- 5. Estatísticas de performance
SELECT * FROM get_query_performance_stats(24);

-- 6. Transação
SELECT execute_transaction('[
    {
        "type": "insert",
        "table": "contracts",
        "data": {"user_id": "user-123", "title": "Novo Contrato", "status": "active"}
    }
]');
*/