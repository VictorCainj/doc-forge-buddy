import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DebugImages() {
  const [contractId, setContractId] = useState('14146');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const verificarImagens = async () => {
    setLoading(true);
    try {
      console.log('=== VERIFICANDO IMAGENS DO CONTRATO', contractId, '===\n');

      // Primeiro, buscar o contrato pelo número para pegar o UUID
      const { data: contratos, error: contratoError } = await supabase
        .from('saved_terms')
        .select('id, form_data')
        .eq('document_type', 'contrato')
        .ilike('form_data->>numeroContrato', `%${contractId}%`);

      if (contratoError) {
        console.error('❌ Erro ao buscar contrato:', contratoError);
        setResult({ error: contratoError.message });
        return;
      }

      if (!contratos || contratos.length === 0) {
        console.log('⚠️ Nenhum contrato encontrado com esse número');
        setResult({ message: 'Nenhum contrato encontrado com esse número' });
        return;
      }

      console.log(`✅ Contratos encontrados: ${contratos.length}`);

      // Pegar o UUID do primeiro contrato encontrado
      const contratoUUID = contratos[0].id;
      console.log(`📋 UUID do contrato: ${contratoUUID}`);

      // Buscar análise do contrato usando o UUID
      const { data: analises, error: analiseError } = await supabase
        .from('vistoria_analises')
        .select('*')
        .eq('contract_id', contratoUUID);

      if (analiseError) {
        console.error('❌ Erro ao buscar análise:', analiseError);
        setResult({ error: analiseError.message });
        return;
      }

      if (!analises || analises.length === 0) {
        console.log('⚠️ Nenhuma análise encontrada');
        setResult({ message: 'Nenhuma análise encontrada para este contrato' });
        return;
      }

      console.log(`✅ Análises encontradas: ${analises.length}`);

      const resultados = [];

      for (const analise of analises) {
        console.log(`\n📋 Análise ID: ${analise.id}`);

        // Buscar imagens desta análise
        const { data: imagens, error: imagensError } = await supabase
          .from('vistoria_images')
          .select('*')
          .eq('vistoria_id', analise.id)
          .order('created_at', { ascending: true });

        if (imagensError) {
          console.error('❌ Erro ao buscar imagens:', imagensError);
          continue;
        }

        console.log(`📸 Total de imagens: ${imagens?.length || 0}`);

        // Agrupar por apontamento
        const porApontamento: Record<
          string,
          { inicial: number; final: number; urls: string[] }
        > = {};

        imagens?.forEach((img) => {
          if (!porApontamento[img.apontamento_id]) {
            porApontamento[img.apontamento_id] = {
              inicial: 0,
              final: 0,
              urls: [],
            };
          }
          if (img.tipo_vistoria === 'inicial') {
            porApontamento[img.apontamento_id].inicial++;
          } else if (img.tipo_vistoria === 'final') {
            porApontamento[img.apontamento_id].final++;
          }
          porApontamento[img.apontamento_id].urls.push(img.image_url);
        });

        // Verificar apontamentos no JSON
        let apontamentosJSON = [];
        if (analise.apontamentos) {
          apontamentosJSON = Array.isArray(analise.apontamentos)
            ? analise.apontamentos
            : JSON.parse(JSON.stringify(analise.apontamentos));
        }

        resultados.push({
          analiseId: analise.id,
          title: analise.title,
          createdAt: new Date(analise.created_at).toLocaleString('pt-BR'),
          totalImagens: imagens?.length || 0,
          porApontamento,
          apontamentosJSON: apontamentosJSON.map((apt: any, index: number) => ({
            index: index + 1,
            ambiente: apt.ambiente,
            fotosInicial: apt.vistoriaInicial?.fotos?.length || 0,
            fotosFinal: apt.vistoriaFinal?.fotos?.length || 0,
          })),
          todasImagens: imagens || [],
        });
      }

      setResult({ analises: resultados });
      console.log('=== FIM DA VERIFICAÇÃO ===');
    } catch (error) {
      console.error('❌ Erro geral:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) {
      verificarImagens();
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔍 Debug de Imagens - Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="ID do Contrato"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={verificarImagens} disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Imagens'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && result.analises && (
          <div className="space-y-6">
            {result.analises.map((analise: any) => (
              <Card key={analise.analiseId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>📋 {analise.title}</span>
                    <Badge variant="outline">
                      {analise.totalImagens} imagens no banco
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-neutral-500">
                    ID: {analise.analiseId} | Criada em: {analise.createdAt}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Distribuição por Apontamento */}
                  <div>
                    <h3 className="font-semibold mb-3">
                      📊 Imagens no Banco (por apontamento)
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(analise.porApontamento).map(
                        ([apontamentoId, counts]: [string, any]) => (
                          <div
                            key={apontamentoId}
                            className="p-3 bg-neutral-100 rounded"
                          >
                            <p className="font-medium">
                              Apontamento ID: {apontamentoId}
                            </p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span>Inicial: {counts.inicial}</span>
                              <span>Final: {counts.final}</span>
                              <span className="font-semibold">
                                Total: {counts.inicial + counts.final}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Apontamentos no JSON */}
                  <div>
                    <h3 className="font-semibold mb-3">
                      📝 Apontamentos no JSON
                    </h3>
                    <div className="space-y-2">
                      {analise.apontamentosJSON.map((apt: any) => (
                        <div
                          key={apt.index}
                          className="p-3 bg-primary-50 rounded"
                        >
                          <p className="font-medium">
                            {apt.index}. {apt.ambiente}
                          </p>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span>Inicial: {apt.fotosInicial}</span>
                            <span>Final: {apt.fotosFinal}</span>
                            <span className="font-semibold">
                              Total: {apt.fotosInicial + apt.fotosFinal}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Todas as URLs */}
                  <div>
                    <h3 className="font-semibold mb-3">
                      🔗 Todas as URLs das Imagens
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {analise.todasImagens.map((img: any, _index: number) => (
                        <div
                          key={img.id}
                          className="p-2 bg-neutral-50 rounded text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                img.tipo_vistoria === 'inicial'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {img.tipo_vistoria}
                            </Badge>
                            <span className="font-mono">{img.file_name}</span>
                          </div>
                          <a
                            href={img.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline block mt-1"
                          >
                            {img.image_url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {result && result.error && (
          <Card>
            <CardContent className="py-6">
              <p className="text-error-600">❌ Erro: {result.error}</p>
            </CardContent>
          </Card>
        )}

        {result && result.message && (
          <Card>
            <CardContent className="py-6">
              <p className="text-neutral-600">⚠️ {result.message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
