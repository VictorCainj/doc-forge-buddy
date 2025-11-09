import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json().catch(() => ({ force: false }));
    
    const scanId = `scan-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const results = {
      scanId,
      timestamp,
      status: 'running' as 'running' | 'completed' | 'failed',
      startTime: new Date().toISOString(),
      results: {
        vulnerabilities: [],
        outdated: [],
        licenses: []
      },
      summary: {
        totalVulnerabilities: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        outdatedPackages: 0,
        licenseIssues: 0
      }
    };

    try {
      // Executar npm audit
      console.log('Running npm audit...');
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const auditResult = JSON.parse(auditOutput);
      
      if (auditResult.vulnerabilities) {
        const vulnerabilities = Object.entries(auditResult.vulnerabilities).map(([name, vuln]: [string, any]) => ({
          name,
          severity: mapSeverity(vuln.severity),
          version: vuln.via?.[0]?.range || 'unknown',
          fixAvailable: !!vuln.effects,
          description: vuln.title || 'No description available',
          cve: vuln.cve
        }));

        results.results.vulnerabilities = vulnerabilities;
        
        // Calcular resumo
        results.summary.totalVulnerabilities = vulnerabilities.length;
        results.summary.critical = vulnerabilities.filter(v => v.severity === 'critical').length;
        results.summary.high = vulnerabilities.filter(v => v.severity === 'high').length;
        results.summary.medium = vulnerabilities.filter(v => v.severity === 'medium').length;
        results.summary.low = vulnerabilities.filter(v => v.severity === 'low').length;
      }
    } catch (auditError) {
      console.log('NPM audit completed with no vulnerabilities or error:', auditError.message);
    }

    try {
      // Verificar pacotes desatualizados
      console.log('Checking outdated packages...');
      const outdatedOutput = execSync('npm outdated --json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const outdated = JSON.parse(outdatedOutput);
      const outdatedPackages = Object.entries(outdated).map(([name, info]: [string, any]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest
      }));

      results.results.outdated = outdatedPackages;
      results.summary.outdatedPackages = outdatedPackages.length;
    } catch (outdatedError) {
      console.log('No outdated packages found or error:', outdatedError.message);
    }

    // Tentar Snyk scan se token disponível
    try {
      console.log('Attempting Snyk scan...');
      const snykOutput = execSync('npx snyk test --json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const snykResult = JSON.parse(snykOutput);
      if (snykResult.vulnerabilities) {
        // Snyk encontrou vulnerabilidades
        results.summary.snykEnabled = true;
      }
    } catch (snykError) {
      console.log('Snyk scan not available or no issues:', snykError.message);
      results.summary.snykEnabled = false;
    }

    results.status = 'completed';
    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime();

    // Determinar risco geral
    if (results.summary.critical > 0) {
      results.riskLevel = 'critical';
    } else if (results.summary.high > 0) {
      results.riskLevel = 'high';
    } else if (results.summary.totalVulnerabilities > 0) {
      results.riskLevel = 'medium';
    } else {
      results.riskLevel = 'low';
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Security scan failed:', error);
    
    return NextResponse.json(
      {
        scanId: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        endTime: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function mapSeverity(npmSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (npmSeverity) {
    case 'low': return 'low';
    case 'moderate': return 'medium';
    case 'high': return 'high';
    case 'critical': return 'critical';
    default: return 'medium';
  }
}
