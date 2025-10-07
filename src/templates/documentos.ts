// Templates para os documentos de rescisão

export const TERMO_RECEBIMENTO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px; font-size: 16px; font-weight: bold;">
    TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
  </div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: 15px;">
Pelo presente, recebemos as chaves do imóvel sito à <strong>{{enderecoImovel}}</strong>, ora locado <strong>{{qualificacaoCompletaLocatarios}}</strong>, devidamente qualificado no contrato de locação <strong>{{tipoContrato}}</strong> firmado em <strong>{{dataFirmamentoContrato}}</strong>.
</div>

<div style="margin: 15px 0; font-size: 15px;">
{{#if nomeProprietario}}
<strong>{{locadorTerm}} DO IMÓVEL:</strong> <strong>{{nomeProprietario}}</strong><br>
{{/if}}
{{#if nomeLocatario}}
<strong>{{dadosLocatarioTitulo}}:</strong> <strong>{{nomeLocatario}}</strong>
{{/if}}
</div>


<div style="margin: 15px 0; font-size: 15px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue <strong>{{quantidadeChaves}}</strong>
</div>

<div style="margin: 15px 0; font-size: 15px;">
<strong>Vistoria realizada em</strong> <strong>{{dataVistoria}}</strong>.
</div>

<div style="margin: 20px 0; font-size: 15px;">
( &nbsp; ) <strong>Imóvel entregue de acordo com a vistoria inicial</strong><br>
( &nbsp; ) <strong>Imóvel não foi entregue de acordo com a vistoria inicial</strong>, constando itens a serem reparados de responsabilidade <strong>{{locatarioResponsabilidade}}</strong>. <strong>Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.</strong>
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: 15px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
      {{#if documentoQuemRetira}}
      <br><span style="font-size: 11px;">{{documentoQuemRetira}}</span>
      {{/if}}
    </div>

    <div>
      __________________________________________<br>
      <span style="font-size: 15px; text-transform: uppercase;">{{assinanteSelecionado}}</span>
    </div>
  </div>
</div>
`;

export const DEVOLUTIVA_PROPRIETARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <p style="margin-bottom: 20px;">{{saudacaoProprietario}}, tudo bem?</p>
  
  {{#if nomeLocatarioFormatado}}
  <p style="margin-bottom: 20px;">Venho comunicar que {{locatarioTermNoArtigo}} <strong>{{nomeLocatarioFormatado}}</strong>, do contrato <strong>{{numeroContrato}}</strong>, {{locatarioComunicou}} na data de <strong>{{dataComunicacao}}</strong> que {{locatarioIra}} desocupar o imóvel.</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">O prazo é de <strong>{{prazoDias}} dias</strong> e se inicia no dia <strong>{{dataInicioRescisao}}</strong>, e termina no dia <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">A vistoria de Saída do imóvel será agendada após o envio de algumas documentações por parte {{locatarioDocumentacao}} dentro do prazo de <strong>{{prazoDias}} (trinta) dias</strong>. <strong>Comunicaremos a data da vistoria com antecedência.</strong></p>
  
  <p style="margin-bottom: 20px;">Comunico que <strong>os valores da rescisão serão computados financeiramente com a cobrança devida após o término dos {{prazoDias}} dias</strong>.</p>
  
  <p style="margin-bottom: 20px;">Anexo a esse e-mail o laudo de vistoria de entrada para seu conhecimento. <strong>O vistoriador na data da vistoria irá seguir conforme esse laudo inicial de entrada.</strong></p>
  
  <p style="margin-bottom: 20px;">Se {{tratamentoProprietarioGenero}} tiver dúvidas, fico à disposição durante o processo de desocupação.</p>
  
  <p style="margin-bottom: 20px;"><strong>Todos os documentos enviados, referentes à data de agendamento de vistoria, termo de comparecimento e conclusão de vistoria, deverão ser devidamente assinados pelas partes envolvidas.</strong> Tal procedimento é necessário para que a Madia possa formalizar e comprovar que todos os processos administrativos vinculados à locação foram realizados com a ciência e participação de todos os contratantes.</p>
  
  <p style="margin-bottom: 20px; font-weight: bold; text-transform: uppercase;">POR FAVOR CONFIRMAR O RECEBIMENTO DESTE E-MAIL.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;

export const DEVOLUTIVA_LOCATARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoLocatario}}
  <p style="margin-bottom: 20px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Confirmamos o recebimento da sua notificação de desocupação do imóvel. <strong>O prazo de {{prazoDias}} dias para desocupação terá início em {{dataInicioRescisao}}, com término em {{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Informamos que, como forma de facilitar sua organização e viabilizar o agendamento da vistoria, solicitamos a gentileza de encaminhar os comprovantes de pagamento acompanhados das respectivas faturas referentes aos meses de <strong>{{mesesComprovantes}}</strong> (tais como <strong>{{documentosSolicitados}}</strong>){{#if solicitarCND}}{{#eq solicitarCND "sim"}} bem como a <strong>Certidão Negativa de Débitos (CND)</strong>{{/eq}}{{/if}}, conforme estabelecido em contrato.</p>
  
  <p style="margin-bottom: 20px;">Após o recebimento e a devida confirmação dos documentos, procederemos com o agendamento da vistoria dentro do prazo de <strong>{{prazoDias}} (trinta) dias</strong>.</p>
  
  <p style="margin-bottom: 20px;"><strong>Pedimos a gentileza de informar a data desejada para a vistoria de saída com, no mínimo, 5 dias de antecedência à data pretendida.</strong></p>
  
  <p style="margin-bottom: 20px;">Também solicitamos o envio da <strong>Notificação de Rescisão preenchida e assinada</strong>. Todas essas orientações constam no Informativo de Rescisão anexo.</p>
  
  <p style="margin-bottom: 20px;">Ressaltamos que <strong>o imóvel deverá ser devolvido nas mesmas condições em que foi entregue</strong>, conforme o <strong>Art. 23 da Lei do Inquilinato <i>"III - restituir o imóvel, finda a locação, no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal"</i></strong>;</p>
  
  {{#if incluirQuantidadeChaves}}
  {{#eq incluirQuantidadeChaves "sim"}}
  <p style="margin-bottom: 20px;">Lembre-se de devolver todas as chaves que foram entregues no início da locação: <strong>{{quantidadeChaves}}</strong>.</p>
  {{/eq}}
  {{/if}}
  
  <p style="margin-bottom: 20px;"><strong>Evite pendências de reprova na vistoria</strong> e atente-se a entregar o imóvel nas condições iniciais - <strong>a entrega de chaves com reprova de laudo enseja direito {{tratamentoLocadorGenero}} o pedido DE LUCROS CESSANTES</strong>.</p>
  
  <p style="margin-bottom: 20px;">Para sua referência, segue também o laudo de vistoria de entrada.</p>
  
  <p style="margin-bottom: 20px;"><strong>Caso o imóvel não seja desocupado dentro do prazo legal, será necessário o envio de nova notificação com uma nova data</strong>. <strong>A ausência dessa comunicação poderá ser interpretada como desistência da Desocupação</strong>.</p>
  
  <p style="margin-bottom: 20px;">Nossa intenção é garantir que todo o processo ocorra de forma tranquila e transparente. Portanto, recomendamos a leitura atenta do informativo anexo e, se houver qualquer dúvida, permanecemos à disposição pelos nossos canais de atendimento.</p>
  
  <p style="margin-bottom: 20px;">Agradecemos desde já pela colaboração!</p>
  
  <p style="margin-bottom: 20px; font-weight: bold; text-transform: uppercase;">POR FAVOR CONFIRMAR O RECEBIMENTO DESTE E-MAIL.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;

export const DEVOLUTIVA_COBRANCA_CONSUMO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoLocatario}}
  <p style="margin-bottom: 20px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Venho por meio desta solicitar os comprovantes de pagamento das contas de consumo do imóvel sito à <strong>{{enderecoImovel}}</strong>, conforme contrato Nº <strong>{{numeroContrato}}</strong> firmado em <strong>{{dataFirmamentoContrato}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Para darmos continuidade ao agendamento da vistoria de saída, solicitamos os comprovantes de pagamento das contas de consumo, acompanhados de suas respectivas faturas (conta completa), referentes aos meses de <strong>{{mesesComprovantes}}</strong>.</p>
  
  <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
    <p style="margin-bottom: 10px; font-weight: bold; color: #007bff;">DOCUMENTOS SOLICITADOS:</p>
    {{#if cpfl}}
    {{#eq cpfl "SIM"}}
    <p style="margin-bottom: 5px;">• CPFL (Energia Elétrica): Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if statusAgua}}
    {{#eq statusAgua "SIM"}}
    <p style="margin-bottom: 5px;">• {{tipoAgua}} (Água): Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarGas}}
    {{#eq solicitarGas "sim"}}
    <p style="margin-bottom: 5px;">• Gás (se houver): Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarCondominio}}
    {{#eq solicitarCondominio "sim"}}
    <p style="margin-bottom: 5px;">• Condomínio: Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarCND}}
    {{#eq solicitarCND "sim"}}
    <p style="margin-bottom: 5px;">• Certidão Negativa de Débitos (CND): Documento atualizado</p>
    {{/eq}}
    {{/if}}
  </div>
  
  <p style="margin-bottom: 20px;"><strong>Solicitamos que encaminhe esses documentos o mais breve possível</strong>, pois são essenciais para o agendamento da vistoria de saída.</p>
  
  <p style="margin-bottom: 20px;"><strong>Conforme estabelecido no contrato de locação, o locatário é responsável pelo pagamento das contas de consumo durante todo o período de ocupação do imóvel</strong>.</p>
  
  <p style="margin-bottom: 20px;">Caso haja alguma dúvida sobre quais documentos são necessários, permanecemos à disposição para esclarecimentos.</p>
  
  <p style="margin-bottom: 20px;">Agradecemos pela compreensão e aguardamos o retorno com os documentos solicitados.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;

export const NOTIFICACAO_AGENDAMENTO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #d32f2f; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
      NOTIFICAÇÃO PARA REALIZAÇÃO DE {{tipoVistoriaTexto}}
    </h1>
  </div>
  
  <div style="margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 15px;"><strong>Notificante:</strong> Madia Imóveis Ltda{{#if nomeProprietarioFormatado}}, no interesse e representante de <span style="font-weight: normal; font-size: 15px; text-transform: none;">{{nomeProprietarioFormatado}}</span> devidamente qualificada  através do contrato de prestação de serviço{{/if}}.</p>
    {{#if nomeLocatarioFormatado}}
    <p style="margin: 5px 0; font-size: 15px;"><strong>{{notificadoLocatarioTitulo}}:</strong> <strong>{{nomeLocatarioFormatado}}</strong></p>
    {{/if}}
    <p style="margin: 5px 0; font-size: 15px;"><strong>Referência:</strong> <strong>{{enderecoImovel}}</strong></p>
  </div>
  
  <div style="margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 15px;"><strong>Prezados,</strong></p>
  </div>
  
  <div style="margin-bottom: 20px; text-align: justify;">
    <p style="margin: 10px 0; font-size: 15px;">No uso de suas atribuições administrativas, a Imobiliária Madia Imóveis, informa formalmente da realização da {{tipoVistoriaTexto}} do Imóvel situado à <strong>{{enderecoImovel}}</strong>, Contrato <strong>{{numeroContrato}}</strong>, agendada para o dia <strong>{{dataVistoria}}</strong>, às <strong>{{horaVistoria}}</strong>, cuja locação, ora em vias de finalização, é de responsabilidade de V.Sas.</p>
    
    <p style="margin: 10px 0; font-size: 15px;">Pelo presente a notificação tem por finalidade comunicar as partes, ou de seus representantes a constata-se à {{tipoVistoriaTexto}} do imóvel citado, que assistirão à produção das fotos que embasam o Laudo de Vistoria e acompanharam a constatação das divergências. <strong>O não comparecimento ao ato, e nem dos representantes, aceitarão antecipadamente os termos integrais da {{tipoVistoriaTextoMaiusculo}}, tal como for apurada</strong>.</p>
    
    <p style="margin: 10px 0; font-size: 15px;">Esta notificação integra o laudo de {{tipoVistoriaTextoMinusculo}} para fins de comparecimento do ato realizado, tal qual das assinaturas realizadas no laudo de conclusão da vistoria, sendo ela <strong>Aprovada ou Reprovada</strong>.</p>
  </div>
  
  <div style="margin-top: 40px;">
    <p style="margin: 5px 0; font-size: 15px;">Cordiais saudações,</p>
    <p style="margin: 5px 0; font-size: 15px;"><strong>MADIA IMÓVEIS LTDA</strong></p>
    <p style="margin: 5px 0; font-size: 15px;">Setor de Rescisão</p>
  </div>
</div>
`;

export const DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if primeiroNomeProprietario}}
  <p style="margin-bottom: 25px;">{{saudacaoProprietario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 25px;">Enviamos um e-mail informando sobre a desocupação do imóvel situado à <strong>{{enderecoImovel}}</strong> (Contrato <strong>{{numeroContrato}}</strong>).</p>
  
  <p style="margin-bottom: 25px;"><strong>O prazo de 30 dias para desocupação se inicia em {{dataInicioRescisao}} e termina em {{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 25px;"><strong>Por favor, verifique seu e-mail e confirme a ciência do recebimento</strong>.</p>
  
  <p style="margin-bottom: 25px;">Se {{tratamentoProprietarioGenero}} tiver dúvidas, fico à disposição durante o processo de desocupação.</p>
  
  <p style="margin-top: 50px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>{{assinanteSelecionado}}</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;">Setor de Rescisão</p>
    <p style="font-size: 15px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if primeiroNomeLocatario}}
  <p style="margin-bottom: 25px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 25px;">Enviamos um e-mail com informações sobre o processo de desocupação do imóvel situado à <strong>{{enderecoImovel}}</strong> (Contrato <strong>{{numeroContrato}}</strong>).</p>
  
  <p style="margin-bottom: 25px;"><strong>Por favor, verifique seu e-mail e confirme a ciência do recebimento</strong>.</p>
  
  <p style="margin-bottom: 25px;">Nossa intenção é garantir que todo o processo ocorra de forma tranquila e transparente. Portanto, se houver qualquer dúvida, permanecemos à disposição pelos nossos canais de atendimento.</p>
  
  <p style="margin-bottom: 25px;">Agradecemos desde já pela colaboração!</p>
  
  <p style="margin-top: 50px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>{{assinanteSelecionado}}</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;">Setor de Rescisão</p>
    <p style="font-size: 15px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_COMERCIAL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoComercial}}
  <p style="margin-bottom: 20px;">Prezados, {{saudacaoComercial}}</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Anexo a notificação de rescisão referente ao Contrato nº <strong>{{numeroContrato}}</strong>, do imóvel situado à <strong>{{enderecoImovel}}</strong>{{#if nomeProprietarioFormatado}}, tendo como {{locadorTermComercial}} <strong>{{nomeProprietarioFormatado}}</strong>{{/if}}{{#if nomeLocatarioFormatado}} e {{locatarioTermComercial}} <strong>{{nomeLocatarioFormatado}}</strong>{{/if}}.</p>
  
  <p style="margin-bottom: 20px;">A notificação foi realizada em <strong>{{dataInicioRescisao}}</strong>, com prazo de rescisão até <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Solicito, por gentileza, que seja encaminhado ao Captador para que entre em contato com {{locadorTerm}}, a fim de averiguar novos valores para uma futura locação.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>Victor Cain Jorge</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;">Setor de Rescisão</p>
    <p style="font-size: 15px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_CADERNINHO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #d32f2f; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
      FORMALIZAÇÃO INTERNA - DEVOLUTIVA COMERCIAL
    </h1>
  </div>
  
  <div style="margin-bottom: 30px; text-align: justify;">
    <p style="margin: 10px 0; font-size: 15px;">Os locatários <strong>{{nomeLocatarioFormatado}}</strong>, do contrato <strong>{{numeroContrato}}</strong>, comunicaram a rescisão do imóvel na <strong>{{enderecoImovel}}</strong>, em <strong>{{dataComunicacao}}</strong>, com prazo até <strong>{{dataTerminoRescisao}}</strong>. A informação foi repassada ao locador e ao setor comercial.</p>
  </div>
  
  <div style="margin-top: 40px; text-align: center;">
    <p style="margin: 5px 0; font-size: 15px;"><strong>MADIA IMÓVEIS LTDA</strong></p>
    <p style="margin: 5px 0; font-size: 15px;">Setor de Rescisão</p>
  </div>
</div>
`;

export const DISTRATO_CONTRATO_LOCACAO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 30px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 40px; font-size: 16px; font-weight: bold; text-transform: uppercase;">
    INSTRUMENTO PARTICULAR DE RESCISÃO DE CONTRATO DE LOCAÇÃO SOB N° {{numeroContrato}}
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Pelo presente Instrumento Particular de Rescisão de Contrato de Locação, as partes, a seguir nomeadas:</p>
  </div>

  <div style="margin-bottom: 25px; font-size: 15px;">
    <p style="margin-bottom: 15px;"><strong>{{locadorTerm}}:</strong> <strong>{{qualificacaoCompletaProprietario}}</strong>.</p>
    
    <p style="margin-bottom: 15px;"><strong>{{locatarioTerm}}:</strong> <strong>{{qualificacaoCompletaLocatarios}}</strong>.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Resolvem em comum acordo, proceder a <strong>RESCISÃO</strong> do contrato de locação referente ao imóvel localizado <strong>{{enderecoImovel}}</strong></p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Todos os valores referentes a alugueis e encargos locatícios foram liquidados até a data de <strong>{{dataLiquidacao}}</strong>, deixado claro o Locador que nada mais tem a pleitear em juízo ou fora dele.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Para tornar firme e valiosa a presente rescisão, <strong>as partes declaram quitadas todas as obrigações locatícias, abrangendo alugueres e encargos de ambas as partes</strong>.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Fica eleito o foro da situação do imóvel, com expressa renúncia de qualquer outro, por mais privilegiado que seja para dirimir as dúvidas porventura advindas o presente Instrumento.</p>
  </div>

  <div style="margin-bottom: 35px; text-align: justify; font-size: 15px;">
    <p style="margin-bottom: 20px;">Por estarem assim justos e acordados, assinam o presente Instrumento em <strong>03 (três) vias de idêntico teor e para o mesmo fim</strong>.</p>
  </div>

  <div style="margin-bottom: 35px; text-align: center; font-size: 15px;">
    <p style="margin-bottom: 25px;">Valinhos, {{dataAtual}}.</p>
  </div>

  <div style="margin-top: 60px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
      <div style="text-align: center; width: 45%;">
        <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
        <p style="font-size: 15px; margin: 0;">Victor Cain Jorge</p>
        <p style="font-size: 11px; margin: 8px 0 0 0;">Administrador</p>
      </div>
      
      <div style="text-align: center; width: 45%;">
        {{#if nomeProprietario}}
        <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
        <p style="font-size: 15px; text-transform: uppercase; margin: 0;">"{{locadorTerm}}"</p>
        <p style="font-size: 15px; margin: 8px 0 0 0;">{{nomeProprietario}}</p>
        {{/if}}
        {{#if primeiroLocatario}}
        <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
        <p style="font-size: 15px; text-transform: uppercase; margin: 0;">"{{locatarioTerm}}"</p>
        <p style="font-size: 15px; margin: 8px 0 0 0;">{{primeiroLocatario}}</p>
        {{/if}}
      </div>
    </div>
  </div>
</div>
`;

// Termo de Recusa de Assinatura - Etapa 1: E-mail
export const TERMO_RECUSA_ASSINATURA_EMAIL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <p style="margin-bottom: 20px;">Prezados,</p>
  
  <p style="margin-bottom: 20px; text-align: justify;">Nos termos do <strong>artigo 23, inciso III, da Lei nº 8.245/91 (Lei do Inquilinato)</strong>, o locatário é responsável por devolver o imóvel nas mesmas condições em que o recebeu, salvo deteriorações decorrentes do uso normal. A vistoria de saída tem como objetivo verificar o cumprimento dessa obrigação legal.</p>
  
  <p style="margin-bottom: 20px; text-align: justify;">A administradora Madia reafirma que todos os procedimentos foram conduzidos com imparcialidade, boa-fé e em estrita observância às normas contratuais e legais, resguardando os interesses de ambas as partes.</p>
  
  <p style="margin-bottom: 20px; text-align: justify;">Informamos que a {{tipoVistoriaTexto}} de saída do imóvel localizado em <strong>{{enderecoImovel}}</strong> foi realizada na data de <strong>{{dataRealizacaoVistoria}}</strong>, conforme previsto em contrato.</p>
  
  <p style="margin-bottom: 20px;">Atenciosamente,</p>
  
  <div style="margin-top: 40px;">
    <p style="margin-bottom: 8px;"><strong>{{assinanteSelecionado}}</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;">Departamento de Rescisão</p>
  </div>
</div>
`;

// Termo de Recusa de Assinatura - Etapa 2: PDF
export const TERMO_RECUSA_ASSINATURA_PDF_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #d32f2f; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
      Registro de Vistoria de Saída – Recusa de Assinatura
    </h1>
  </div>
  
  <p style="margin-bottom: 20px;">Prezado (a) - <strong>{{nomeLocatarioFormatado}}</strong></p>
  
  <p style="margin-bottom: 20px; text-align: justify;">Informamos que a vistoria de saída do imóvel localizado em <strong>{{enderecoImovel}}</strong> foi realizada na data de <strong>{{dataVistoria}}</strong>, conforme previsto em contrato.</p>
  
  <p style="margin-bottom: 20px; text-align: justify;">O laudo correspondente foi apresentado para ciência e assinatura do locatário, porém <strong>houve recusa formal em assiná-lo</strong>. Em razão das limitações do sistema de assinatura eletrônica, <strong>a recusa será registrada administrativamente pela Madia e arquivada como parte integrante do processo de desocupação</strong>, servindo como comprovação da condição do imóvel na data da vistoria.</p>
  
  <p style="margin-bottom: 20px; text-align: justify;">Ressaltamos que <strong>o laudo está acompanhado de documentação fotográfica e demais evidências que comprovam o estado do imóvel no momento da devolução</strong>.</p>
  
  <p style="margin-bottom: 20px;">Atenciosamente,</p>
  
  <div style="margin-top: 40px;">
    <p style="margin-bottom: 8px;"><strong>Nome do Gestor:</strong> {{assinanteSelecionado}}</p>
    <p style="margin-bottom: 8px; font-size: 15px;"><strong>Setor:</strong> Rescisão</p>
    <p style="margin-bottom: 8px; font-size: 15px;"><strong>Madia Imóveis</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;"><strong>Telefone:</strong> 19-3869-3555</p>
    <p style="font-size: 15px;"><strong>E-mail:</strong> rescisao@madia.com.br</p>
  </div>
</div>
`;

export const STATUS_VISTORIA_WHATSAPP_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/jSbw2Ec.jpeg" alt="Madia Imóveis" style="height: 150px; width: auto; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 15px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoLocatario}}
  <p style="margin-bottom: 25px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 25px;">Informamos que a vistoria do imóvel situado à <strong>{{enderecoImovel}}</strong> (Contrato <strong>{{numeroContrato}}</strong>) foi <strong>{{statusVistoria}}</strong>.</p>
  
  {{#eq statusVistoria "APROVADA"}}
  <p style="margin-bottom: 25px;"><strong>Vistoria Aprovada</strong></p>
  <p style="margin-bottom: 25px;">As chaves já podem ser entregues na <strong>Imobiliária Madia</strong>, localizada na <strong>Av. Dom Nery, 445 - Vila Embare, Valinhos - SP, 13271-170</strong>.</p>
  {{/eq}}
  
  {{#eq statusVistoria "REPROVADA"}}
  <p style="margin-bottom: 25px;"><strong>Vistoria Reprovada</strong></p>
  <p style="margin-bottom: 25px;">Os reparos apontados pelo vistoriador devem ser realizados para que possamos reagendar a <strong>Revistoria</strong>.</p>
  <p style="margin-bottom: 25px;">O valor da taxa de Revistoria é de <strong>R$ 150,00</strong>.</p>
  {{/eq}}
  
  <p style="margin-bottom: 25px;">O <strong>laudo completo</strong> está sendo enviado via <strong>e-mail</strong> para assinatura digital.</p>
  
  <p style="margin-bottom: 25px;">Caso tenha alguma dúvida, ou conteste alguns dos itens permanecemos à disposição pelos nossos canais de atendimento.</p>
  
  <p style="margin-top: 50px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>{{assinanteSelecionado}}</strong></p>
    <p style="margin-bottom: 8px; font-size: 15px;">Setor de Rescisão</p>
    <p style="font-size: 15px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;
