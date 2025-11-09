import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const SecurityScanner = {
  async scan() {
    console.log('🔍 Iniciando scanner de segurança...');
    
    const vulnerabilities = await this.scanNpmAudit();
    const outdated = await this.scanOutdated();
    const licenseIssues = await this.scanLicenses();
    
    return {
      vulnerabilities,
      outdated,
      licenseIssues
    };
  },
  
  async scanNpmAudit() {
    try {
      console.log('📋 Executando npm audit...');
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const auditResult = JSON.parse(output);
      
      const vulnerabilities = [];
      
      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(([name, vuln]) => {
          vulnerabilities.push({
            name,
            severity: this.mapNpmSeverity(vuln.severity),
            version: vuln.via?.[0]?.range || 'unknown',
            fixAvailable: !!vuln.effects,
            description: vuln.title || 'No description available',
            cve: vuln.cve,
            via: vuln.via
          });
        });
      }
      
      console.log(`✅ Found ${vulnerabilities.length} vulnerabilities via npm audit`);
      return vulnerabilities;
    } catch (error) {
      console.error('❌ Error running npm audit:', error.message);
      return [];
    }
  },
  
  async scanOutdated() {
    try {
      console.log('📦 Checking for outdated packages...');
      const output = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(output);
      
      const outdatedPackages = Object.entries(outdated).map(([name, info]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest
      }));
      
      console.log(`✅ Found ${outdatedPackages.length} outdated packages`);
      return outdatedPackages;
    } catch (error) {
      console.log('ℹ️  No outdated packages found or error checking');
      return [];
    }
  },
  
  async scanLicenses() {
    try {
      console.log('⚖️  Checking licenses...');
      const output = execSync('npx license-checker --json', { encoding: 'utf8' });
      const licenses = JSON.parse(output);
      
      const licenseIssues = [];
      
      // Definir licenças problemáticas
      const problematicLicenses = ['GPL', 'AGPL', 'LGPL', 'BSL', 'CPOL'];
      
      Object.entries(licenses).forEach(([pkg, info]) => {
        if (info.licenses && problematicLicenses.some(lic => info.licenses.includes(lic))) {
          licenseIssues.push({
            name: pkg,
            version: info.version,
            license: info.licenses,
            severity: 'high'
          });
        }
      });
      
      console.log(`✅ Found ${licenseIssues.length} license issues`);
      return licenseIssues;
    } catch (error) {
      console.log('ℹ️  No license check performed (license-checker not available)');
      return [];
    }
  },
  
  mapNpmSeverity(npmSeverity) {
    switch (npmSeverity) {
      case 'low': return 'low';
      case 'moderate': return 'medium';
      case 'high': return 'high';
      case 'critical': return 'critical';
      default: return 'medium';
    }
  },
  
  generateSummary(report) {
    const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = report.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumVulns = report.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowVulns = report.vulnerabilities.filter(v => v.severity === 'low').length;
    
    return `
🔒 Security Scan Summary
========================

Vulnerabilities: ${report.vulnerabilities.length}
├── Critical: ${criticalVulns}
├── High: ${highVulns}
├── Medium: ${mediumVulns}
└── Low: ${lowVulns}

Outdated Packages: ${report.outdated.length}
License Issues: ${report.licenseIssues.length}

Risk Level: ${this.getRiskLevel(criticalVulns, highVulns)}
`;
  },
  
  getRiskLevel(critical, high) {
    if (critical > 0) return '🔴 CRITICAL';
    if (high > 0) return '🟠 HIGH';
    if (critical + high > 0) return '🟡 MEDIUM';
    return '🟢 LOW';
  }
};

// Executar scan
async function main() {
  const report = await SecurityScanner.scan();
  
  console.log(SecurityScanner.generateSummary(report));
  
  // Salvar relatório
  const reportData = {
    timestamp: new Date().toISOString(),
    ...report
  };
  
  // Executar apenas em CI ou quando solicitado explicitamente
  if (process.env.CI === 'true' || process.argv.includes('--report')) {
    require('fs').writeFileSync(
      'security-report.json',
      JSON.stringify(reportData, null, 2)
    );
    console.log('📄 Security report saved to security-report.json');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export default SecurityScanner;
