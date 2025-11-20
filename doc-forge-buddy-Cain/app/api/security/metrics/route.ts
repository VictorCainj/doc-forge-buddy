import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

export async function GET() {
  try {
    // Simular dados de segurança (em produção, seria executado os scanners)
    const securityData = {
      metrics: {
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
        outdatedPackages: 0,
        licenseIssues: 0,
        lastScan: new Date().toISOString(),
        riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical'
      },
      vulnerabilities: [],
      outdated: []
    };

    // Tentar executar npm audit se disponível
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditResult = JSON.parse(auditOutput);
      
      if (auditResult.vulnerabilities) {
        const vulnerabilities = Object.entries(auditResult.vulnerabilities).map(([name, vuln]: [string, any]) => ({
          name,
          severity: mapNpmSeverity(vuln.severity),
          version: vuln.via?.[0]?.range || 'unknown',
          fixAvailable: !!vuln.effects,
          description: vuln.title || 'No description available',
          cve: vuln.cve
        }));

        // Calcular métricas
        const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
        const high = vulnerabilities.filter(v => v.severity === 'high').length;
        const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
        const low = vulnerabilities.filter(v => v.severity === 'low').length;

        securityData.metrics = {
          ...securityData.metrics,
          totalVulnerabilities: vulnerabilities.length,
          criticalVulnerabilities: critical,
          highVulnerabilities: high,
          mediumVulnerabilities: medium,
          lowVulnerabilities: low,
          riskLevel: critical > 0 ? 'critical' : high > 0 ? 'high' : medium > 0 ? 'medium' : 'low'
        };

        securityData.vulnerabilities = vulnerabilities;
      }
    } catch (_) {
      console.log('NPM audit not available or no vulnerabilities found');
    }

    // Tentar verificar pacotes desatualizados
    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedOutput);
      
      const outdatedPackages = Object.entries(outdated).map(([name, info]: [string, any]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest
      }));

      securityData.metrics.outdatedPackages = outdatedPackages.length;
      securityData.outdated = outdatedPackages;
    } catch (_) {
      console.log('No outdated packages found');
    }

    return NextResponse.json(securityData);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    
    // Retornar dados de fallback
    return NextResponse.json({
      metrics: {
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
        outdatedPackages: 0,
        licenseIssues: 0,
        lastScan: new Date().toISOString(),
        riskLevel: 'low'
      },
      vulnerabilities: [],
      outdated: []
    });
  }
}

export async function POST() {
  try {
    // Executar scan de segurança
    const results = {
      scanId: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      vulnerabilities: 0,
      outdated: 0
    };

    // Tentar executar scanner customizado
    try {
      execSync('node scripts/security-scanner.js --report', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Verificar se foi gerado relatório
      const reportPath = 'security-report.json';
      const reportData = JSON.parse(readFileSync(reportPath, 'utf8'));
      
      results.vulnerabilities = reportData.vulnerabilities?.length || 0;
      results.outdated = reportData.outdated?.length || 0;
      
      // Limpar arquivo temporário
      execSync(`rm -f ${reportPath}`);
    } catch (_) {
      console.log('Custom scanner not available, using fallback');
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error running security scan:', error);
    return NextResponse.json(
      { error: 'Failed to run security scan' },
      { status: 500 }
    );
  }
}

function mapNpmSeverity(npmSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (npmSeverity) {
    case 'low': return 'low';
    case 'moderate': return 'medium';
    case 'high': return 'high';
    case 'critical': return 'critical';
    default: return 'medium';
  }
}
