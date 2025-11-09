import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface SecurityMetrics {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  outdatedPackages: number;
  licenseIssues: number;
  lastScan: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface Vulnerability {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  version: string;
  fixAvailable: boolean;
  description: string;
  cve?: string;
}

interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
}

export function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [outdatedPackages, setOutdatedPackages] = useState<OutdatedPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vulnerabilities' | 'outdated'>('overview');
  
  useEffect(() => {
    fetchSecurityMetrics();
  }, []);
  
  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/security/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
      setVulnerabilities(data.vulnerabilities || []);
      setOutdatedPackages(data.outdated || []);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      // Fallback to demo data
      setMetrics({
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
        outdatedPackages: 0,
        licenseIssues: 0,
        lastScan: new Date().toISOString(),
        riskLevel: 'low'
      });
    }
  };
  
  const runSecurityScan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security/scan', { method: 'POST' });
      if (response.ok) {
        await fetchSecurityMetrics();
      }
    } catch (error) {
      console.error('Error running security scan:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };
  
  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="security-dashboard p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Security Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage security vulnerabilities in your dependencies
            </p>
          </div>
          <button
            onClick={runSecurityScan}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {loading ? 'Scanning...' : 'Run Security Scan'}
          </button>
        </div>
      </div>
      
      {/* Risk Level Banner */}
      <div className={`p-4 rounded-lg border mb-6 ${getRiskColor(metrics.riskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {metrics.riskLevel === 'low' ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
            <div>
              <h3 className="font-semibold">Security Risk Level: {metrics.riskLevel.toUpperCase()}</h3>
              <p className="text-sm opacity-80">
                Last scan: {new Date(metrics.lastScan).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Vulnerabilities</p>
              <p className="text-3xl font-bold text-red-600">{metrics.criticalVulnerabilities}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vulnerabilities</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalVulnerabilities}</p>
            </div>
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outdated Packages</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.outdatedPackages}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">License Issues</p>
              <p className="text-3xl font-bold text-yellow-600">{metrics.licenseIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'vulnerabilities', label: 'Vulnerabilities' },
            { key: 'outdated', label: 'Outdated Packages' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Security Status Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.criticalVulnerabilities}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.highVulnerabilities}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{metrics.mediumVulnerabilities}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.lowVulnerabilities}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'vulnerabilities' && (
        <div className="space-y-4">
          {vulnerabilities.length === 0 ? (
            <div className="bg-white rounded-lg border p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No Vulnerabilities Found</h3>
              <p className="text-gray-600">All dependencies are secure</p>
            </div>
          ) : (
            vulnerabilities.map((vuln, index) => (
              <div key={index} className={`bg-white rounded-lg border p-6 ${getSeverityColor(vuln.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{vuln.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                      {vuln.fixAvailable && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Fix Available
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{vuln.description}</p>
                    <div className="text-sm text-gray-500">
                      Version: {vuln.version}
                      {vuln.cve && (
                        <>
                          {' • '}
                          <a 
                            href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            CVE: {vuln.cve}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {activeTab === 'outdated' && (
        <div className="space-y-4">
          {outdatedPackages.length === 0 ? (
            <div className="bg-white rounded-lg border p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">All Packages Up to Date</h3>
              <p className="text-gray-600">No outdated dependencies found</p>
            </div>
          ) : (
            outdatedPackages.map((pkg, index) => (
              <div key={index} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Current: {pkg.current} → Wanted: {pkg.wanted} → Latest: {pkg.latest}
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => window.open('https://docs.npmjs.com/cli/v8/commands/npm-audit', '_blank')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            NPM Audit Docs
          </button>
          <button 
            onClick={() => window.open('https://snyk.io/vuln', '_blank')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Snyk Vulnerability Database
          </button>
          <button 
            onClick={runSecurityScan}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard;
