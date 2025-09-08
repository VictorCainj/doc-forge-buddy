// Templates para os documentos de desocupação

export const TERMO_RECEBIMENTO_TEMPLATE = `
<div style="text-align: center; margin-bottom: 20px; font-size: 16px; font-weight: bold;">
TERMO DE RECEBIMENTO DE CHAVES {{numeroContrato}}
</div>

<div style="text-align: right; margin-bottom: 20px; font-size: 14px;">
Valinhos, {{dataAtual}}.
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
Pelo presente, recebemos as chaves do imóvel sito à {{enderecoImovel}}, ora locado {{nomeLocatario}}, devidamente qualificado no contrato de locação residencial firmado em {{dataFirmamentoContrato}}.
</div>

<div style="margin: 15px 0; font-size: 14px;">
<strong>LOCADOR DO IMÓVEL:</strong> {{nomeProprietario}}<br>
<strong>DADOS DO LOCATÁRIO:</strong> {{nomeLocatario}}
</div>

<div style="margin: 15px 0; font-size: 14px;">
<strong>COMPROVANTES DE CONTAS DE CONSUMO APRESENTADAS:</strong><br>
{{cpflDaev}}<br>
<br>
<strong>OBS:</strong> Caso haja valor integral ou proporcional das contas de consumo, referente ao período do contrato até a efetiva entrega de chaves será de responsabilidade do Locatário.
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
( &nbsp; ) Imóvel não foi entregue de acordo com a vistoria inicial, constando itens a serem reparados de responsabilidade do locatário. Irá ser realizado um orçamento dos reparos e cobrado no valor da rescisão.
</div>

<div style="margin-top: 50px; text-align: center;">
<div style="margin-bottom: 40px;">
__________________________________________<br>
<span style="font-size: 12px; text-transform: uppercase;">{{nomeQuemRetira}}</span>
</div>

<div>
__________________________________________<br>
<span style="font-size: 12px; text-transform: uppercase;">VICTOR CAIN JORGE</span>
</div>
</div>
`;

export const DEVOLUTIVA_PROPRIETARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000;">
  <h2 style="text-align: center; margin-bottom: 40px; font-size: 18px; font-weight: bold;">
    [CONTRATO] - Notificação de Desocupação e Agendamento de Vistoria.
  </h2>
  
  <p style="margin-bottom: 20px;">{{proprietarioPrezado}} <strong>{{nomeProprietario}}</strong>, tudo bem?</p>
  
  <p style="margin-bottom: 20px;">Venho comunicar que {{locatarioTerm}} <strong>{{nomeLocatario}}</strong>, do contrato <strong>{{numeroContrato}}</strong>, {{locatarioComunicou}} na data de <strong>{{dataComunicacao}}</strong> que {{locatarioIra}} desocupar o imóvel.</p>
  
  <p style="margin-bottom: 20px;">O prazo é de <strong>{{prazoDias}} dias</strong> e se inicia no dia <strong>{{dataInicioDesocupacao}}</strong>, e termina no dia <strong>{{dataTerminoDesocupacao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">A vistoria de Saída do imóvel será agendada após o envio de algumas documentações por parte do locatário dentro do prazo de <strong>{{prazoDias}} (trinta) dias</strong>. Comunicaremos a data da vistoria com antecedência.</p>
  
  <p style="margin-bottom: 20px;">Comunico que os valores da rescisão serão computados financeiramente com a cobrança devida após o término dos <strong>{{prazoDias}} dias</strong>.</p>
  
  <p style="margin-bottom: 20px;">Anexo a esse e-mail o laudo de vistoria de entrada para seu conhecimento. O vistoriador na data da vistoria irá seguir conforme esse laudo inicial de entrada.</p>
  
  <p style="margin-bottom: 20px;">Se o(a) senhor(a) tiver dúvidas, fico à disposição durante a vigência do processo de desocupação.</p>
  
  <p style="margin-bottom: 20px;">Todos os documentos enviados deverão ser assinados pelas partes, no que se refere a data de agendamento de vistoria, termo de comparecimento de vistoria e conclusão de vistoria, pois a Madia deve documentar que, todos os processos administrativos, como contratante serão efetuados e realizados por todas as partes.</p>
  
  <p style="margin-bottom: 20px; font-weight: bold; text-transform: uppercase;">POR FAVOR CONFIRMAR O RECEBIMENTO DESTE E-MAIL.</p>
  
  <p style="margin-top: 40px;">Atenciosamente</p>
</div>
`;

export const DEVOLUTIVA_LOCATARIO_TEMPLATE = `
<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #000;">
  <p style="margin-bottom: 20px;">{{proprietarioPrezado}} <strong>{{nomeLocatario}}</strong>, tudo bem?</p>
  
  <p style="margin-bottom: 20px;">Confirmamos o recebimento da sua notificação de desocupação do imóvel. O prazo de {{prazoDias}} dias para desocupação terá início em <strong>{{dataInicioDesocupacao}}</strong>, com término em <strong>{{dataTerminoDesocupacao}}</strong>.</p>
  
  <p style="margin-bottom: 20px;">Informamos que, como forma de facilitar sua organização e viabilizar o agendamento da vistoria, solicitamos a gentileza de encaminhar os comprovantes de pagamento acompanhados das respectivas faturas referentes aos meses de <strong>{{mesesComprovantes}}</strong> (tais como <strong>condomínio, água, energia elétrica, gás</strong>) bem como a <strong>Certidão Negativa de Débitos (CND)</strong>, conforme estabelecido em contrato.</p>
  
  <p style="margin-bottom: 20px;">Após o recebimento e a devida confirmação dos documentos, procederemos com o agendamento da vistoria dentro do prazo de {{prazoDias}} (trinta) dias. Realizar o agendamento com <strong>5 dias de antecedência</strong> a data pretendida.</p>
  
  <p style="margin-bottom: 20px;">Também solicitamos o envio da <strong>Notificação de Rescisão</strong> preenchida e assinada. Todas essas orientações constam no <strong>Informativo de Desocupação</strong> anexo.</p>
  
  <p style="margin-bottom: 20px;">Ressaltamos que o imóvel deverá ser devolvido nas mesmas condições em que foi entregue, conforme o Art. 23 da Lei do Inquilinato "III - restituir o imóvel, finda a locação, no estado em que o recebeu, salvo as deteriorações decorrentes do seu uso normal;</p>
  
  <p style="margin-bottom: 20px;">Evite pendencias de reprova na vistoria e atente-se a entregar o imóvel nas condições iniciais - a entrega de chaves com reprova de laudo enseja direito ao locador o pedido <strong>DE LUCROS CESSANTES</strong>.</p>
  
  <p style="margin-bottom: 20px;">Para sua referência, segue também o laudo de vistoria de entrada.</p>
  
  <p style="margin-bottom: 20px;">Caso o imóvel não seja desocupado dentro do prazo legal, será necessário o envio de nova notificação com uma nova data. A ausência dessa comunicação poderá ser interpretada como <strong>desistência da desocupação</strong>.</p>
  
  <p style="margin-bottom: 20px;">Nossa intenção é garantir que todo o processo ocorra de forma tranquila e transparente. Portanto, recomendamos a leitura atenta do informativo anexo e, se houver qualquer dúvida, permanecemos à disposição pelos nossos canais de atendimento.</p>
  
  <p style="margin-bottom: 20px;">Agradecemos desde já pela colaboração!</p>
  
  <p style="margin-top: 40px;">Atenciosamente,</p>
</div>
`;
