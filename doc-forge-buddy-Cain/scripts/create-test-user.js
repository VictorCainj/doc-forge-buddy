#!/usr/bin/env node

/**
 * Script para criar usuário de teste e inserir dados mockados
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://agzutoonsruttqbjnclo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnenV0b29uc3J1dHRxYmpuY2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzA3OTIsImV4cCI6MjA3MjYwNjc5Mn0.jhhSy3qXsvlwFqoVVNDXGSYSgfs-Et_F2_ZAgqtAdj4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUserAndData() {
  try {
    // 1. Criar usuário de teste
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'teste@contratos.com',
      password: '123456',
      options: {
        data: {
          full_name: 'Usuário de Teste'
        }
      }
    });

    if (authError) {
      console.log('Usuário pode já existir ou erro:', authError.message);
    } else {
      console.log('Usuário criado com sucesso:', authData.user?.email);
    }

    // 2. Inserir contratos de teste
    const userId = authData.user?.id;
    if (userId) {
      const testContracts = [
        {
          id: 'test-1',
          title: 'Contrato de Locação - João Silva',
          document_type: 'contrato',
          form_data: {
            locatario_nome: 'João Silva',
            imovel_endereco: 'Rua das Flores, 123, Centro',
            status: 'pendente',
            valor_aluguel: '1500.00'
          },
          content: 'Conteúdo do contrato...',
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'test-2',
          title: 'Contrato de Locação - Maria Santos',
          document_type: 'contrato',
          form_data: {
            locatario_nome: 'Maria Santos',
            imovel_endereco: 'Av. Principal, 456, Vila Nova',
            status: 'concluido',
            valor_aluguel: '2000.00'
          },
          content: 'Conteúdo do contrato...',
          user_id: userId,
          created_at: new Date(Date.now() - 86400000).toISOString(), // Ontem
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'test-3',
          title: 'Contrato de Locação - Carlos Oliveira',
          document_type: 'contrato',
          form_data: {
            locatario_nome: 'Carlos Oliveira',
            imovel_endereco: 'Rua do Sol, 789, Jardim',
            status: 'pendente',
            valor_aluguel: '1800.00'
          },
          content: 'Conteúdo do contrato...',
          user_id: userId,
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          updated_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      const { data, error } = await supabase
        .from('saved_terms')
        .insert(testContracts);

      if (error) {
        console.log('Erro ao inserir contratos:', error.message);
      } else {
        console.log('Contratos de teste inseridos com sucesso!');
      }
    }

    console.log('\n=== CREDENCIAIS DE TESTE ===');
    console.log('Email: teste@contratos.com');
    console.log('Senha: 123456');
    console.log('============================\n');

  } catch (error) {
    console.error('Erro:', error);
  }
}

createTestUserAndData();