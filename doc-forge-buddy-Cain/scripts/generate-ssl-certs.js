#!/usr/bin/env node

/**
 * Script para gerar certificados SSL para desenvolvimento e produção
 * 
 * Uso:
 * node scripts/generate-ssl-certs.js [dev|prod] [domain]
 * 
 * Exemplo:
 * node scripts/generate-ssl-certs.js dev localhost
 * node scripts/generate-ssl-certs.js prod exemplo.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const environment = args[0] || 'dev';
const domain = args[1] || 'localhost';

console.log(`🔐 Gerando certificados SSL para ${environment} (${domain})`);

const certsDir = path.join(__dirname, '../ssl-certs');
const envDir = path.join(certsDir, environment);

// Criar diretório se não existir
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir);
}

const keyPath = path.join(envDir, 'private-key.pem');
const certPath = path.join(envDir, 'certificate.pem');
const csrPath = path.join(envDir, 'certificate.csr');
const configPath = path.join(envDir, 'openssl.cnf');

try {
  // Configuração OpenSSL
  const opensslConfig = `
[req]
default_bits = 2048
default_md = sha256
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = BR
ST = São Paulo
L = São Paulo
O = Doc Forge Buddy
OU = IT Department
CN = ${domain}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${domain}
DNS.2 = *.${domain}
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
`;

  // Escrever configuração
  fs.writeFileSync(configPath, opensslConfig);

  if (environment === 'dev') {
    // Certificado auto-assinado para desenvolvimento
    console.log('📝 Gerando certificado auto-assinado para desenvolvimento...');
    
    const opensslCmd = `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -config ${configPath} -extensions v3_req`;
    
    execSync(opensslCmd, { stdio: 'inherit' });
    
    console.log('✅ Certificado auto-assinado gerado com sucesso!');
  } else {
    // CSR para produção (será assinado por uma CA)
    console.log('📋 Gerando CSR para produção...');
    
    const csrCmd = `openssl req -new -newkey rsa:2048 -nodes -keyout ${keyPath} -out ${csrPath} -config ${configPath}`;
    
    execSync(csrCmd, { stdio: 'inherit' });
    
    console.log('✅ CSR gerado com sucesso!');
    console.log(`📄 CSR salvo em: ${csrPath}`);
    console.log('🔑 Chave privada salva em:', keyPath);
    console.log('');
    console.log('📋 Para obter o certificado assinado:');
    console.log(`   1. Envie o CSR (${csrPath}) para sua CA`);
    console.log('   2. Após receber o certificado, salve-o como:', certPath);
  }

  // Verificar certificados
  console.log('\n🔍 Verificando certificados...');
  
  if (fs.existsSync(certPath)) {
    const certInfo = execSync(`openssl x509 -in ${certPath} -text -noout`, { encoding: 'utf8' });
    console.log('✅ Certificado válido encontrado');
    
    // Extrair informações do certificado
    const subjectMatch = certInfo.match(/Subject:.*CN = ([^\n]+)/);
    const validUntilMatch = certInfo.match(/Not After : ([^\n]+)/);
    
    if (subjectMatch) {
      console.log(`📋 Subject: ${subjectMatch[1]}`);
    }
    if (validUntilMatch) {
      console.log(`📅 Válido até: ${validUntilMatch[1]}`);
    }
  }
  
  if (fs.existsSync(keyPath)) {
    console.log('✅ Chave privada encontrada');
  }

  // Instruções de uso
  console.log('\n📖 Instruções de uso:');
  console.log('===================');
  console.log(`📁 Certificados salvos em: ${envDir}`);
  console.log(`🔑 Chave privada: ${keyPath}`);
  console.log(`📜 Certificado: ${certPath}`);
  
  if (environment === 'dev') {
    console.log('\n💻 Para usar em desenvolvimento:');
    console.log('1. Configure o .env.production com os caminhos dos certificados');
    console.log('2. Use o certificado auto-assinado (será aceito pelo navegador)');
    console.log('3. Execute: node server.js');
  } else {
    console.log('\n🌐 Para usar em produção:');
    console.log('1. Configure o .env.production com os caminhos dos certificados');
    console.log('2. Instale o certificado assinado pela CA no servidor');
    console.log('3. Execute: NODE_ENV=production node server.js');
  }

  console.log('\n🛡️ Configuração de segurança:');
  console.log('- Certificado RSA 2048 bits');
  console.log('- Hash SHA256');
  console.log('- Validade de 365 dias (desenvolvimento)');
  console.log('- Subject Alternative Names incluídos');
  console.log('- Chave privada protegida');

} catch (error) {
  console.error('❌ Erro ao gerar certificados:', error.message);
  process.exit(1);
} finally {
  // Limpeza de arquivos temporários
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  if (environment === 'prod' && fs.existsSync(csrPath)) {
    console.log(`\n🗂️ CSR mantido em: ${csrPath} (necessário para obter o certificado assinado)`);
  } else if (fs.existsSync(csrPath)) {
    fs.unlinkSync(csrPath);
  }
}

console.log('\n🎉 Processo concluído!');