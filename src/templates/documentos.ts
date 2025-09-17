// Templates para os documentos de rescisão

export const TERMO_RECEBIMENTO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px; font-size: 16px; font-weight: bold;">
    TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
  </div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
Pelo presente, recebemos as chaves do imóvel sito à <strong>{{enderecoImovel}}</strong>, ora locado <strong>{{qualificacaoCompletaLocatarios}}</strong>, devidamente qualificado no contrato de locação <strong>{{tipoContrato}}</strong> firmado em {{dataFirmamentoContrato}}.
</div>

<div style="margin: 15px 0; font-size: 14px;">
{{#if nomeProprietario}}
<strong>{{locadorTerm}} DO IMÓVEL:</strong> {{nomeProprietario}}<br>
{{/if}}
{{#if nomeLocatario}}
<strong>{{dadosLocatarioTitulo}}:</strong> {{nomeLocatario}}
{{/if}}
</div>


<div style="margin: 15px 0; font-size: 14px;">
<strong>Entregue na Madia Imóveis a relação de chaves:</strong><br>
Foi entregue {{quantidadeChaves}}
</div>

<div style="margin: 15px 0; font-size: 14px;">
<strong>Vistoria realizada em</strong> {{dataVistoria}}.
</div>

<div style="margin: 20px 0; font-size: 14px;">
( &nbsp; ) Imóvel entregue de acordo com a vistoria inicial<br>
( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade {{locatarioResponsabilidade}}. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

  <div style="margin-top: 50px; text-align: center;">
    <div style="margin-bottom: 40px;">
      __________________________________________<br>
      <span style="font-size: 12px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
      {{#if documentoQuemRetira}}
      <br><span style="font-size: 11px;">{{documentoQuemRetira}}</span>
      {{/if}}
    </div>

    <div>
      __________________________________________<br>
      <span style="font-size: 12px; text-transform: uppercase;">VICTOR CAIN JORGE</span>
    </div>
  </div>
</div>
`;

export const DEVOLUTIVA_PROPRIETARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <p style="margin-bottom: 20px;">{{saudacaoProprietario}}, tudo bem?</p>
  
  {{#if nomeLocatarioFormatado}}
  <p style="margin-bottom: 20px;">Venho comunicar que {{locatarioTermNoArtigo}} <strong>{{nomeLocatarioFormatado}}</strong>, do contrato <strong>{{numeroContrato}}</strong>, {{locatarioComunicou}} na data de <strong>{{dataComunicacao}}</strong> que {{locatarioIra}} desocupar o imóvel.</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">O prazo é de <strong>{{prazoDias}} dias</strong> e se inicia no dia <strong>{{dataInicioRescisao}}</strong>, e termina no dia <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">A vistoria de Saída do imóvel será agendada após o envio de algumas documentações por parte {{locatarioDocumentacao}} dentro do prazo de <strong>{{prazoDias}} (trinta) dias</strong>. Comunicaremos a data da vistoria com antecedência.</p>
  
  <p style="margin-bottom: 20px;">Comunico que os valores da rescisão serão computados financeiramente com a cobrança devida após o término dos <strong>{{prazoDias}} dias</strong>.</p>
  
  <p style="margin-bottom: 20px;">Anexo a esse e-mail o laudo de vistoria de entrada para seu conhecimento. O vistoriador na data da vistoria irá seguir conforme esse laudo inicial de entrada.</p>
  
  <p style="margin-bottom: 20px;">Se {{tratamentoProprietarioGenero}} tiver dúvidas, fico à disposição durante a vigência do processo de rescisão.</p>
  
  <p style="margin-bottom: 20px;">Todos os documentos enviados deverão ser assinados pelas partes, no que se refere a data de agendamento de vistoria, termo de comparecimento de vistoria e conclusão de vistoria, pois a Madia deve documentar que, todos os processos administrativos, como contratante serão efetuados e realizados por todas as partes.</p>
  
  <p style="margin-bottom: 20px; font-weight: bold; text-transform: uppercase;">POR FAVOR CONFIRMAR O RECEBIMENTO DESTE E-MAIL.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;

export const DEVOLUTIVA_LOCATARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoLocatario}}
  <p style="margin-bottom: 20px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Confirmamos o recebimento da {{tratamentoLocatarioGenero}} notificação de rescisão do imóvel. O prazo de {{prazoDias}} dias para rescisão terá início em <strong>{{dataInicioRescisao}}</strong>, com término em <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Informamos que, como forma de facilitar {{tratamentoLocatarioGenero}} organização e viabilizar o agendamento da vistoria, solicitamos a gentileza de encaminhar os comprovantes de pagamento acompanhados das respectivas faturas referentes aos meses de <strong>{{mesesComprovantes}}</strong> (tais como <strong>{{documentosSolicitados}}</strong>){{#if solicitarCND}}{{#eq solicitarCND "sim"}} bem como a <strong>Certidão Negativa de Débitos (CND)</strong>{{/eq}}{{/if}}, conforme estabelecido em contrato.</p>
  
  <p style="margin-bottom: 20px;">Após o recebimento e a devida confirmação dos documentos, procederemos com o agendamento da vistoria dentro do prazo de {{prazoDias}} (trinta) dias. </p>

  <p style="margin-bottom: 20px;">Informar a data desejada para a vistoria de saída com <strong>5 dias de antecedência</strong> a data pretendida.</p>
  
  <p style="margin-bottom: 20px;">Também solicitamos o envio da <strong>Notificação de Rescisão</strong> preenchida e assinada. Todas essas orientações constam no <strong>Informativo de Rescisão</strong> anexo.</p>
  
  <p style="margin-bottom: 20px;">Ressaltamos que o imóvel deverá ser devolvido nas mesmas condições em que foi entregue, conforme o Art. 23 da Lei do Inquilinato "III - restituir o imóvel, finda a locação, no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal;</p>
  
  {{#if incluirQuantidadeChaves}}
  {{#eq incluirQuantidadeChaves "sim"}}
  <p style="margin-bottom: 20px;">Lembre-se de devolver todas as chaves que foram entregues no início da locação: <strong>{{quantidadeChaves}}</strong>.</p>
  {{/eq}}
  {{/if}}
  
  <p style="margin-bottom: 20px;">Evite pendencias de reprova na vistoria e atente-se a entregar o imóvel nas condições iniciais - a entrega de chaves com reprova de laudo enseja direito {{tratamentoLocadorGenero}} o pedido <strong>DE LUCROS CESSANTES</strong>.</p>
  
  <p style="margin-bottom: 20px;">Para {{tratamentoLocatarioGenero}} referência, segue também o laudo de vistoria de entrada.</p>
  
  <p style="margin-bottom: 20px;">Caso o imóvel não seja desocupado dentro do prazo legal, será necessário o envio de nova notificação com uma nova data. A ausência dessa comunicação poderá ser interpretada como <strong>desistência da rescisão</strong>.</p>
  
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
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoLocatario}}
  <p style="margin-bottom: 20px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Venho por meio desta solicitar os comprovantes de pagamento das contas de consumo do imóvel sito à <strong>{{enderecoImovel}}</strong>, conforme contrato Nº <strong>{{numeroContrato}}</strong> firmado em <strong>{{dataFirmamentoContrato}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Para darmos continuidade ao processo de rescisão, solicitamos os comprovantes de pagamento das contas de consumo, acompanhados de suas respectivas faturas, referentes aos meses de <strong>{{mesesComprovantes}}</strong>.</p>
  
  <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
    <p style="margin-bottom: 10px; font-weight: bold; color: #007bff;">DOCUMENTOS SOLICITADOS:</p>
    {{#if cpfl}}
    {{#eq cpfl "SIM"}}
    <p style="margin-bottom: 5px;">• <strong>CPFL (Energia Elétrica):</strong> Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if statusAgua}}
    {{#eq statusAgua "SIM"}}
    <p style="margin-bottom: 5px;">• <strong>{{tipoAgua}} (Água):</strong> Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarGas}}
    {{#eq solicitarGas "sim"}}
    <p style="margin-bottom: 5px;">• <strong>Gás (se houver):</strong> Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarCondominio}}
    {{#eq solicitarCondominio "sim"}}
    <p style="margin-bottom: 5px;">• <strong>Condomínio:</strong> Comprovante de pagamento e fatura</p>
    {{/eq}}
    {{/if}}
    {{#if solicitarCND}}
    {{#eq solicitarCND "sim"}}
    <p style="margin-bottom: 5px;">• <strong>Certidão Negativa de Débitos (CND):</strong> Documento atualizado</p>
    {{/eq}}
    {{/if}}
  </div>
  
  <p style="margin-bottom: 20px;">Solicitamos que encaminhe esses documentos o mais breve possível, pois são essenciais para a finalização do processo de rescisão.</p>
  
  <p style="margin-bottom: 20px;">Conforme estabelecido no contrato de locação, o locatário é responsável pelo pagamento das contas de consumo durante todo o período de ocupação do imóvel.</p>
  
  <p style="margin-bottom: 20px;">Caso haja alguma dúvida sobre quais documentos são necessários, permanecemos à disposição para esclarecimentos.</p>
  
  <p style="margin-bottom: 20px;">Agradecemos pela compreensão e aguardamos o retorno com os documentos solicitados.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;

export const NOTIFICACAO_AGENDAMENTO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #d32f2f; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
      NOTIFICAÇÃO PARA REALIZAÇÃO DE {{tipoVistoriaTexto}}
    </h1>
  </div>
  
  <div style="margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 14px;"><strong>Notificante:</strong> Madia Imóveis Ltda{{#if nomeProprietarioFormatado}}, no interesse e representante de {{nomeProprietarioFormatado}} devidamente qualificada  através do contrato de prestação de serviço{{/if}}.</p>
    {{#if nomeLocatarioFormatado}}
    <p style="margin: 5px 0; font-size: 14px;"><strong>{{notificadoLocatarioTitulo}}:</strong> {{nomeLocatarioFormatado}}</p>
    {{/if}}
    <p style="margin: 5px 0; font-size: 14px;"><strong>Referência:</strong> {{enderecoImovel}}</p>
  </div>
  
  <div style="margin-bottom: 20px;">
    <p style="margin: 5px 0; font-size: 14px;"><strong>Prezados,</strong></p>
  </div>
  
  <div style="margin-bottom: 20px; text-align: justify;">
    <p style="margin: 10px 0; font-size: 14px;">No uso de suas atribuições administrativas, a Imobiliária Madia Imóveis, informa formalmente da realização da {{tipoVistoriaTexto}} do Imóvel situado <strong>{{enderecoImovel}}</strong>, Contrato <strong>{{numeroContrato}}</strong>, agendada para o dia <strong>{{dataVistoria}}</strong>, às <strong>{{horaVistoria}}</strong>, cuja locação, ora em vias de finalização, é de responsabilidade de {{tratamentoLocatarioNotificacao}}.</p>
    
    <p style="margin: 10px 0; font-size: 14px;">Pelo presente a notificação tem por finalidade comunicar as partes, ou de seus representantes a constata-se à {{tipoVistoriaTexto}} do imóvel citado, que assistirão à produção das fotos que embasam o Laudo de Vistoria e acompanharam a constatação das divergências. O não comparecimento ao ato, e nem dos representantes, <strong><u>aceitarão antecipadamente os termos integrais da {{tipoVistoriaTextoMaiusculo}}, tal como for apurada.</u></strong></p>
    
    <p style="margin: 10px 0; font-size: 14px;">Esta notificação integra o laudo de {{tipoVistoriaTextoMinusculo}} para fins de comparecimento do ato realizado, tal qual das assinaturas realizadas no laudo de conclusão da vistoria, sendo ela Aprovada ou Reprovada.</p>
  </div>
  
  <div style="margin-top: 40px;">
    <p style="margin: 5px 0; font-size: 14px;">Cordiais saudações,</p>
    <p style="margin: 5px 0; font-size: 14px;"><strong>MADIA IMÓVEIS LTDA</strong></p>
    <p style="margin: 5px 0; font-size: 14px;">Setor de Rescisão</p>
  </div>
</div>
`;

export const DEVOLUTIVA_PROPRIETARIO_WHATSAPP_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if primeiroNomeProprietario}}
  <p style="margin-bottom: 25px;">{{saudacaoProprietario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 25px;">Enviamos um e-mail informando sobre a rescisão do imóvel situado à <strong>{{enderecoImovel}}</strong> (Contrato <strong>{{numeroContrato}}</strong>).</p>
  
  <p style="margin-bottom: 25px;">O prazo de <strong>30 dias</strong> para rescisão se inicia em <strong>{{dataInicioRescisao}}</strong> e termina em <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 25px;">Por favor, verifique seu e-mail e confirme a ciência do recebimento.</p>
  
  <p style="margin-bottom: 25px;">Se {{tratamentoProprietarioGenero}} tiver dúvidas, fico à disposição durante a vigência do processo de rescisão.</p>
  
  <p style="margin-top: 50px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>VICTOR</strong></p>
    <p style="margin-bottom: 8px; font-size: 14px;">Setor de Rescisão</p>
    <p style="font-size: 14px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_LOCATARIO_WHATSAPP_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if primeiroNomeLocatario}}
  <p style="margin-bottom: 25px;">{{saudacaoLocatario}}, tudo bem?</p>
  {{/if}}
  
  <p style="margin-bottom: 25px;">Enviamos um e-mail com informações sobre o processo de rescisão do imóvel situado à <strong>{{enderecoImovel}}</strong> (Contrato <strong>{{numeroContrato}}</strong>).</p>
  
  <p style="margin-bottom: 25px;">Por favor, verifique seu e-mail e confirme a ciência do recebimento.</p>
  
  <p style="margin-bottom: 25px;">Nossa intenção é garantir que todo o processo ocorra de forma tranquila e transparente. Portanto, se houver qualquer dúvida, permanecemos à disposição pelos nossos canais de atendimento.</p>
  
  <p style="margin-bottom: 25px;">Agradecemos desde já pela colaboração!</p>
  
  <p style="margin-top: 50px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>VICTOR</strong></p>
    <p style="margin-bottom: 8px; font-size: 14px;">Setor de Rescisão</p>
    <p style="font-size: 14px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_COMERCIAL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  {{#if saudacaoComercial}}
  <p style="margin-bottom: 20px;">Prezados, {{saudacaoComercial}}</p>
  {{/if}}
  
  <p style="margin-bottom: 20px;">Anexo a notificação de rescisão referente ao Contrato nº <strong>{{numeroContrato}}</strong>, do imóvel situado à <strong>{{enderecoImovel}}</strong>{{#if nomeProprietarioFormatado}}, tendo como LOCADORES {{nomeProprietarioFormatado}}{{/if}}{{#if nomeLocatarioFormatado}} e LOCATÁRIOS <strong>{{nomeLocatarioFormatado}}</strong>{{/if}}.</p>
  
  <p style="margin-bottom: 20px;">A notificação foi realizada em <strong>{{dataInicioRescisao}}</strong>, com prazo de rescisão até <strong>{{dataTerminoRescisao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Solicito, por gentileza, que seja encaminhado ao Captador para que entre em contato com {{locadorTerm}}, a fim de averiguar novos valores para uma futura locação.</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
  
  <div style="margin-top: 30px;">
    <p style="margin-bottom: 8px;"><strong>VICTOR CAIN JORGE</strong></p>
    <p style="margin-bottom: 8px; font-size: 14px;">Setor de Rescisão</p>
    <p style="font-size: 14px;">MADIA IMÓVEIS LTDA</p>
  </div>
</div>
`;

export const DEVOLUTIVA_CADERNINHO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #d32f2f; font-weight: bold; font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px;">
      FORMALIZAÇÃO INTERNA - PROCESSO DE RESCISÃO
    </h1>
  </div>
  
  <div style="margin-bottom: 30px; text-align: justify;">
    <p style="margin: 10px 0; font-size: 14px;">Os locatários {{nomeLocatarioFormatado}}, do contrato {{numeroContrato}}, comunicaram a rescisão do imóvel na {{enderecoImovel}}, em {{dataComunicacao}}, com prazo até {{dataTerminoRescisao}}. A informação foi repassada ao locador e ao setor comercial.</p>
  </div>
  
  <div style="margin-top: 40px; text-align: center;">
    <p style="margin: 5px 0; font-size: 14px;"><strong>MADIA IMÓVEIS LTDA</strong></p>
    <p style="margin: 5px 0; font-size: 14px;">Setor de Rescisão</p>
  </div>
</div>
`;

export const DISTRATO_CONTRATO_LOCACAO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000; max-width: 800px; margin: 0 auto; padding: 30px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
    <div style="flex: 0 0 auto;">
      <img src="https://i.imgur.com/xwz1P7v.png" alt="Madia Imóveis" style="height: 60px; width: auto;" />
    </div>
    <div style="flex: 1; text-align: right; font-size: 14px; margin-left: 20px;">
      Valinhos, {{dataAtual}}.
    </div>
  </div>
  
  <div style="text-align: center; margin-bottom: 40px; font-size: 16px; font-weight: bold; text-transform: uppercase;">
    INSTRUMENTO PARTICULAR DE RESCISÃO DE CONTRATO DE LOCAÇÃO SOB N° {{numeroContrato}}
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Pelo presente Instrumento Particular de Rescisão de Contrato de Locação, as partes, a seguir nomeadas:</p>
  </div>

  <div style="margin-bottom: 25px; font-size: 14px;">
    <p style="margin-bottom: 15px;"><strong>{{locadorTerm}}:</strong> {{qualificacaoCompletaProprietario}}.</p>
    
    <p style="margin-bottom: 15px;"><strong>{{locatarioTerm}}:</strong> {{qualificacaoCompletaLocatarios}}.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Resolvem em comum acordo, proceder a <strong>RESCISÃO</strong> do contrato de locação referente ao imóvel localizado <strong>{{enderecoImovel}}</strong></p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Todos os valores referentes a alugueis e encargos locatícios foram liquidados até a data de <strong>{{dataLiquidacao}}</strong>, deixado claro o Locador que nada mais tem a pleitear em juízo ou fora dele.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Para tornar firme e valiosa a presente rescisão, as partes declaram quitadas todas as obrigações locatícias, abrangendo alugueres e encargos de ambas as partes.</p>
  </div>

  <div style="margin-bottom: 25px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Fica eleito o foro da situação do imóvel, com expressa renúncia de qualquer outro, por mais privilegiado que seja para dirimir as dúvidas porventura advindas o presente Instrumento.</p>
  </div>

  <div style="margin-bottom: 35px; text-align: justify; font-size: 14px;">
    <p style="margin-bottom: 20px;">Por estarem assim justos e acordados, assinam o presente Instrumento em 03 (três) vias de idêntico teor e para o mesmo fim, perante as testemunhas abaixo.</p>
  </div>

  <div style="margin-bottom: 35px; text-align: center; font-size: 14px;">
    <p style="margin-bottom: 25px;">Valinhos, {{dataAtual}}.</p>
  </div>

  <div style="margin-top: 60px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 50px;">
      <div style="text-align: center; width: 45%;">
        {{#if nomeProprietario}}
        <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
        <p style="font-size: 12px; text-transform: uppercase; margin: 0;">"{{locadorTerm}}"</p>
        <p style="font-size: 12px; margin: 8px 0 0 0;">{{nomeProprietario}}</p>
        {{/if}}
      </div>
      
      <div style="text-align: center; width: 45%;">
        {{#if primeiroLocatario}}
        <div style="margin-bottom: 20px;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px; height: 35px;"></div>
          <p style="font-size: 11px; text-transform: uppercase; margin: 0;">"{{locatarioTerm}}"</p>
          <p style="font-size: 11px; margin: 5px 0 0 0;">{{primeiroLocatario}}</p>
        </div>
        {{/if}}
        {{#if segundoLocatario}}
        <div style="margin-bottom: 20px;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px; height: 35px;"></div>
          <p style="font-size: 11px; text-transform: uppercase; margin: 0;">"{{locatarioTerm}}"</p>
          <p style="font-size: 11px; margin: 5px 0 0 0;">{{segundoLocatario}}</p>
        </div>
        {{/if}}
        {{#if terceiroLocatario}}
        <div style="margin-bottom: 20px;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px; height: 35px;"></div>
          <p style="font-size: 11px; text-transform: uppercase; margin: 0;">"{{locatarioTerm}}"</p>
          <p style="font-size: 11px; margin: 5px 0 0 0;">{{terceiroLocatario}}</p>
        </div>
        {{/if}}
        {{#if quartoLocatario}}
        <div>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px; height: 35px;"></div>
          <p style="font-size: 11px; text-transform: uppercase; margin: 0;">"{{locatarioTerm}}"</p>
          <p style="font-size: 11px; margin: 5px 0 0 0;">{{quartoLocatario}}</p>
        </div>
        {{/if}}
      </div>
    </div>

    <div style="margin-top: 50px;">
      <p style="font-size: 14px; font-weight: bold; margin-bottom: 25px; text-align: center;">Testemunhas:</p>
      
      <div style="display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
          <p style="font-size: 12px; margin: 0;">CINTIA PEREIRA ALMEIDA GOMES</p>
          <p style="font-size: 11px; margin: 8px 0 0 0;">CPF: 289.212.608-89</p>
        </div>
        
        <div style="text-align: center; width: 45%;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 15px; height: 40px;"></div>
          <p style="font-size: 12px; margin: 0;">FABIANA SALOTTI MARTINS</p>
          <p style="font-size: 11px; margin: 8px 0 0 0;">CPF: 357.106.138-19</p>
        </div>
      </div>
    </div>
  </div>
</div>
`;
