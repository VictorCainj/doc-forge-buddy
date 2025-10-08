// Script para verificar imagens do contrato 14146
// Cole este código no console do navegador (F12) quando estiver na aplicação

async function verificarImagensContrato() {
  const contratoId = '14146';
  
  console.log('=== VERIFICANDO IMAGENS DO CONTRATO 14146 ===\n');
  
  try {
    // Buscar análise do contrato
    const { data: analises, error: analiseError } = await supabase
      .from('vistoria_analises')
      .select('*')
      .eq('contract_id', contratoId);
    
    if (analiseError) {
      console.error('❌ Erro ao buscar análise:', analiseError);
      return;
    }
    
    if (!analises || analises.length === 0) {
      console.log('⚠️ Nenhuma análise encontrada para o contrato 14146');
      return;
    }
    
    console.log(`✅ Análises encontradas: ${analises.length}`);
    
    for (const analise of analises) {
      console.log(`\n📋 Análise ID: ${analise.id}`);
      console.log(`   Título: ${analise.title}`);
      console.log(`   Criada em: ${new Date(analise.created_at).toLocaleString('pt-BR')}`);
      
      // Buscar imagens desta análise
      const { data: imagens, error: imagensError } = await supabase
        .from('vistoria_images')
        .select('*')
        .eq('vistoria_id', analise.id)
        .order('created_at', { ascending: true });
      
      if (imagensError) {
        console.error('   ❌ Erro ao buscar imagens:', imagensError);
        continue;
      }
      
      console.log(`   📸 Total de imagens: ${imagens?.length || 0}`);
      
      if (imagens && imagens.length > 0) {
        // Agrupar por apontamento
        const porApontamento = {};
        imagens.forEach(img => {
          if (!porApontamento[img.apontamento_id]) {
            porApontamento[img.apontamento_id] = { inicial: 0, final: 0 };
          }
          if (img.tipo_vistoria === 'inicial') {
            porApontamento[img.apontamento_id].inicial++;
          } else if (img.tipo_vistoria === 'final') {
            porApontamento[img.apontamento_id].final++;
          }
        });
        
        console.log('\n   📊 Distribuição por apontamento:');
        Object.entries(porApontamento).forEach(([apontamentoId, counts]) => {
          console.log(`      Apontamento ${apontamentoId}:`);
          console.log(`        - Inicial: ${counts.inicial} imagem(ns)`);
          console.log(`        - Final: ${counts.final} imagem(ns)`);
        });
        
        console.log('\n   🔗 URLs das imagens:');
        imagens.forEach((img, index) => {
          console.log(`      ${index + 1}. [${img.tipo_vistoria}] ${img.file_name}`);
          console.log(`         URL: ${img.image_url}`);
        });
      }
      
      // Verificar apontamentos no JSON
      if (analise.apontamentos) {
        const apontamentos = Array.isArray(analise.apontamentos) 
          ? analise.apontamentos 
          : JSON.parse(analise.apontamentos);
        
        console.log(`\n   📝 Apontamentos no JSON: ${apontamentos.length}`);
        apontamentos.forEach((apt, index) => {
          const fotosInicial = apt.vistoriaInicial?.fotos?.length || 0;
          const fotosFinal = apt.vistoriaFinal?.fotos?.length || 0;
          console.log(`      ${index + 1}. ${apt.ambiente}: ${fotosInicial} inicial + ${fotosFinal} final`);
        });
      }
    }
    
    console.log('\n=== FIM DA VERIFICAÇÃO ===');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
verificarImagensContrato();
