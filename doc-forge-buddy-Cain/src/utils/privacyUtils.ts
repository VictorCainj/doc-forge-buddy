/**
 * Utilitários para anonimização de dados pessoais
 * Usado para proteger informações sensíveis em gravações e demonstrações
 */

/**
 * Anonimiza um nome completo mantendo apenas o primeiro nome
 * Exemplo: "João Silva Santos" -> "João S."
 */
export function anonymizeName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === '') {
    return '[NOME NÃO INFORMADO]';
  }

  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 0) {
    return '[NOME NÃO INFORMADO]';
  }

  // Se tiver apenas um nome, retorna ele
  if (nameParts.length === 1) {
    return nameParts[0];
  }

  // Retorna primeiro nome + primeira letra do último sobrenome
  const firstName = nameParts[0];
  const lastInitial = nameParts[nameParts.length - 1][0]?.toUpperCase() || '';
  
  return `${firstName} ${lastInitial}.`;
}

/**
 * Anonimiza múltiplos nomes separados por vírgula ou "e"
 * Usa splitNames para extrair nomes individuais e depois reformata seguindo o padrão convencional
 */
export function anonymizeNamesList(names: string | null | undefined): string {
  if (!names || names.trim() === '') {
    return '[NOMES NÃO INFORMADOS]';
  }

  // Importar splitNames e formatNamesList dinamicamente para evitar dependência circular
  // Usar regex similar ao splitNames para extrair nomes individuais
  const nameList = names
    .split(/[,]|(?:\s+e\s+)|(?:\s+E\s+)|\n+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (nameList.length === 0) {
    return '[NOMES NÃO INFORMADOS]';
  }

  // Anonimizar cada nome
  const anonymizedNames = nameList.map(anonymizeName);

  // Reformatar seguindo o padrão convencional: 1 nome sem separador, 2 nomes com "e", 3+ nomes com vírgulas e "e"
  if (anonymizedNames.length === 1) {
    return anonymizedNames[0];
  }
  if (anonymizedNames.length === 2) {
    return `${anonymizedNames[0]} e ${anonymizedNames[1]}`;
  }

  return anonymizedNames.slice(0, -1).join(', ') + ' e ' + anonymizedNames[anonymizedNames.length - 1];
}

/**
 * Anonimiza um endereço mantendo apenas a cidade
 * Exemplo: "Rua das Flores, 123, Centro, São Paulo - SP" -> "São Paulo - SP"
 */
export function anonymizeAddress(address: string | null | undefined): string {
  if (!address || address.trim() === '') {
    return '[ENDEREÇO NÃO INFORMADO]';
  }

  // Tentar extrair cidade e estado
  // Padrões comuns: "..., Cidade - UF" ou "..., Cidade, UF" ou "Cidade - UF"
  const cityStatePattern = /([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ\s]+)\s*[-–]\s*([A-Z]{2})/i;
  const match = address.match(cityStatePattern);
  
  if (match) {
    const city = match[1].trim();
    const state = match[2].trim().toUpperCase();
    return `${city} - ${state}`;
  }

  // Se não encontrar padrão, tentar pegar última parte (geralmente é cidade)
  const parts = address.split(',').map(p => p.trim());
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    // Se parecer com cidade/estado, retornar
    if (lastPart.match(/^[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ\s]+/i)) {
      return lastPart;
    }
  }

  // Fallback: retornar apenas "[CIDADE]"
  return '[CIDADE]';
}

/**
 * Anonimiza CPF mantendo apenas os últimos 2 dígitos
 * Exemplo: "123.456.789-00" -> "***.***.***-00"
 */
export function anonymizeCPF(cpf: string | null | undefined): string {
  if (!cpf || cpf.trim() === '') {
    return '[CPF NÃO INFORMADO]';
  }

  // Remover formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return '[CPF INVÁLIDO]';
  }

  // Manter apenas últimos 2 dígitos
  const lastTwo = cleanCPF.slice(-2);
  return `***.***.***-${lastTwo}`;
}

/**
 * Anonimiza RG mantendo apenas os últimos 2 dígitos
 */
export function anonymizeRG(rg: string | null | undefined): string {
  if (!rg || rg.trim() === '') {
    return '[RG NÃO INFORMADO]';
  }

  // Remover formatação
  const cleanRG = rg.replace(/\D/g, '');
  
  if (cleanRG.length < 2) {
    return '[RG INVÁLIDO]';
  }

  // Manter apenas últimos 2 dígitos
  const lastTwo = cleanRG.slice(-2);
  return `***.***-${lastTwo}`;
}

/**
 * Anonimiza telefone mantendo apenas os últimos 2 dígitos
 */
export function anonymizePhone(phone: string | null | undefined): string {
  if (!phone || phone.trim() === '') {
    return '[TELEFONE NÃO INFORMADO]';
  }

  // Remover formatação
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 2) {
    return '[TELEFONE INVÁLIDO]';
  }

  // Manter apenas últimos 2 dígitos
  const lastTwo = cleanPhone.slice(-2);
  return `(**) *****-${lastTwo}`;
}

/**
 * Anonimiza email mantendo apenas o domínio
 */
export function anonymizeEmail(email: string | null | undefined): string {
  if (!email || email.trim() === '') {
    return '[EMAIL NÃO INFORMADO]';
  }

  const [localPart, domain] = email.split('@');
  
  if (!domain) {
    return '[EMAIL INVÁLIDO]';
  }

  // Manter apenas primeira letra do nome + domínio
  const firstLetter = localPart[0]?.toUpperCase() || '*';
  return `${firstLetter}***@${domain}`;
}

/**
 * Aplica anonimização completa em um objeto de dados de contrato
 * Cobre TODOS os campos que podem conter informações pessoais
 */
export function anonymizeContractData(data: Record<string, any>): Record<string, any> {
  const anonymized = { ...data };

  // ============================================
  // ANONIMIZAR NOMES DE LOCATÁRIOS
  // ============================================
  if (anonymized.nomeLocatario) {
    anonymized.nomeLocatario = anonymizeName(anonymized.nomeLocatario);
  }
  if (anonymized.primeiroLocatario) {
    anonymized.primeiroLocatario = anonymizeName(anonymized.primeiroLocatario);
  }
  if (anonymized.segundoLocatario) {
    anonymized.segundoLocatario = anonymizeName(anonymized.segundoLocatario);
  }
  if (anonymized.terceiroLocatario) {
    anonymized.terceiroLocatario = anonymizeName(anonymized.terceiroLocatario);
  }
  if (anonymized.quartoLocatario) {
    anonymized.quartoLocatario = anonymizeName(anonymized.quartoLocatario);
  }
  if (anonymized.nomeLocatarioFormatado) {
    // Verificar se contém vírgulas ou " e " para determinar se são múltiplos nomes
    const hasMultipleNames = /,\s*|\s+e\s+/i.test(anonymized.nomeLocatarioFormatado);
    if (hasMultipleNames) {
      // Múltiplos nomes formatados - usar anonymizeNamesList
      anonymized.nomeLocatarioFormatado = anonymizeNamesList(anonymized.nomeLocatarioFormatado);
    } else {
      // Um único nome completo - usar anonymizeName diretamente
      anonymized.nomeLocatarioFormatado = anonymizeName(anonymized.nomeLocatarioFormatado);
    }
  }

  // ============================================
  // ANONIMIZAR NOMES DE PROPRIETÁRIOS/LOCADORES
  // ============================================
  if (anonymized.nomeProprietario) {
    anonymized.nomeProprietario = anonymizeNamesList(anonymized.nomeProprietario);
  }
  if (anonymized.nomesResumidosLocadores) {
    anonymized.nomesResumidosLocadores = anonymizeNamesList(anonymized.nomesResumidosLocadores);
  }
  if (anonymized.nomeProprietarioFormatado) {
    anonymized.nomeProprietarioFormatado = anonymizeNamesList(anonymized.nomeProprietarioFormatado);
  }

  // ============================================
  // ANONIMIZAR NOMES DE FIADORES
  // ============================================
  if (anonymized.nomeFiador) {
    anonymized.nomeFiador = anonymizeNamesList(anonymized.nomeFiador);
  }
  if (anonymized.primeiroFiador) {
    anonymized.primeiroFiador = anonymizeName(anonymized.primeiroFiador);
  }
  if (anonymized.segundoFiador) {
    anonymized.segundoFiador = anonymizeName(anonymized.segundoFiador);
  }
  if (anonymized.terceiroFiador) {
    anonymized.terceiroFiador = anonymizeName(anonymized.terceiroFiador);
  }
  if (anonymized.quartoFiador) {
    anonymized.quartoFiador = anonymizeName(anonymized.quartoFiador);
  }
  if (anonymized.nomeFiadoresFormatado) {
    anonymized.nomeFiadoresFormatado = anonymizeNamesList(anonymized.nomeFiadoresFormatado);
  }

  // ============================================
  // ANONIMIZAR NOMES EM CAMPOS ESPECIAIS
  // ============================================
  if (anonymized.nomeQuemRetira) {
    anonymized.nomeQuemRetira = anonymizeName(anonymized.nomeQuemRetira);
  }
  if (anonymized.assinanteSelecionado) {
    anonymized.assinanteSelecionado = anonymizeName(anonymized.assinanteSelecionado);
  }
  if (anonymized.nomeGestor) {
    anonymized.nomeGestor = anonymizeName(anonymized.nomeGestor);
  }
  if (anonymized.nomeVistoriador) {
    anonymized.nomeVistoriador = anonymizeName(anonymized.nomeVistoriador);
  }

  // ============================================
  // ANONIMIZAR QUALIFICAÇÕES COMPLETAS
  // ============================================
  if (anonymized.qualificacaoCompletaLocatarios) {
    anonymized.qualificacaoCompletaLocatarios = anonymizeNamesList(anonymized.qualificacaoCompletaLocatarios);
  }
  if (anonymized.qualificacaoCompletaLocadores) {
    anonymized.qualificacaoCompletaLocadores = anonymizeNamesList(anonymized.qualificacaoCompletaLocadores);
  }
  if (anonymized.qualificacaoCompleta) {
    anonymized.qualificacaoCompleta = anonymizeNamesList(anonymized.qualificacaoCompleta);
  }

  // ============================================
  // ANONIMIZAR ENDEREÇOS
  // ============================================
  if (anonymized.endereco) {
    anonymized.endereco = anonymizeAddress(anonymized.endereco);
  }
  if (anonymized.enderecoImovel) {
    anonymized.enderecoImovel = anonymizeAddress(anonymized.enderecoImovel);
  }
  if (anonymized.logradouro) {
    anonymized.logradouro = anonymizeAddress(anonymized.logradouro);
  }
  if (anonymized.rua) {
    anonymized.rua = anonymizeAddress(anonymized.rua);
  }

  // ============================================
  // ANONIMIZAR DOCUMENTOS (CPF/RG)
  // ============================================
  if (anonymized.cpfLocatario) {
    anonymized.cpfLocatario = anonymizeCPF(anonymized.cpfLocatario);
  }
  if (anonymized.rgLocatario) {
    anonymized.rgLocatario = anonymizeRG(anonymized.rgLocatario);
  }
  if (anonymized.cpfProprietario) {
    anonymized.cpfProprietario = anonymizeCPF(anonymized.cpfProprietario);
  }
  if (anonymized.rgProprietario) {
    anonymized.rgProprietario = anonymizeRG(anonymized.rgProprietario);
  }
  if (anonymized.documentoQuemRetira) {
    // Pode ser CPF ou RG, tentar ambos
    const doc = anonymized.documentoQuemRetira.toString();
    if (doc.replace(/\D/g, '').length === 11) {
      anonymized.documentoQuemRetira = anonymizeCPF(doc);
    } else {
      anonymized.documentoQuemRetira = anonymizeRG(doc);
    }
  }
  if (anonymized.cpf) {
    anonymized.cpf = anonymizeCPF(anonymized.cpf);
  }
  if (anonymized.rg) {
    anonymized.rg = anonymizeRG(anonymized.rg);
  }

  // ============================================
  // ANONIMIZAR CONTATOS (TELEFONE/CELULAR)
  // ============================================
  if (anonymized.telefoneLocatario) {
    anonymized.telefoneLocatario = anonymizePhone(anonymized.telefoneLocatario);
  }
  if (anonymized.celularLocatario) {
    anonymized.celularLocatario = anonymizePhone(anonymized.celularLocatario);
  }
  if (anonymized.telefoneProprietario) {
    anonymized.telefoneProprietario = anonymizePhone(anonymized.telefoneProprietario);
  }
  if (anonymized.celularProprietario) {
    anonymized.celularProprietario = anonymizePhone(anonymized.celularProprietario);
  }
  if (anonymized.telefone) {
    anonymized.telefone = anonymizePhone(anonymized.telefone);
  }
  if (anonymized.celular) {
    anonymized.celular = anonymizePhone(anonymized.celular);
  }

  // ============================================
  // ANONIMIZAR EMAILS
  // ============================================
  if (anonymized.emailLocatario) {
    anonymized.emailLocatario = anonymizeEmail(anonymized.emailLocatario);
  }
  if (anonymized.emailProprietario) {
    anonymized.emailProprietario = anonymizeEmail(anonymized.emailProprietario);
  }
  if (anonymized.email) {
    anonymized.email = anonymizeEmail(anonymized.email);
  }

  // ============================================
  // ANONIMIZAR CAMPOS DE TEXTO QUE PODEM CONTER DADOS PESSOAIS
  // ============================================
  // Anonimizar campos de texto que podem conter nomes ou informações pessoais
  // Usar regex para detectar padrões de nomes e substituir
  const textFields = [
    'textoEntregaChaves',
    'observacao',
    'citacaoLocatarios',
    'locatarioTerm',
    'proprietarioTerm',
    'saudacaoProprietario',
    'saudacaoLocatario',
  ];

  textFields.forEach((field) => {
    if (anonymized[field] && typeof anonymized[field] === 'string') {
      // Substituir nomes completos por versões anonimizadas no texto
      let text = anonymized[field];
      
      // Substituir nomes de locatários
      if (anonymized.nomeLocatario && text.includes(anonymized.nomeLocatario)) {
        const originalName = anonymized.nomeLocatario;
        const anonymizedName = anonymizeName(originalName);
        text = text.replace(new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), anonymizedName);
      }
      
      // Substituir nomes de proprietários
      if (anonymized.nomeProprietario && text.includes(anonymized.nomeProprietario)) {
        const originalName = anonymized.nomeProprietario;
        const anonymizedName = anonymizeNamesList(originalName);
        text = text.replace(new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), anonymizedName);
      }
      
      anonymized[field] = text;
    }
  });

  return anonymized;
}

