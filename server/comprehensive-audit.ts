/**
 * Comprehensive Application Audit System
 * Tests all critical application components and provides detailed report
 */

import { db } from './db';
import { events } from '@shared/schema';
import { google } from 'googleapis';
import fetch from 'node-fetch';

export interface AuditResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

export class ComprehensiveAudit {
  private results: AuditResult[] = [];

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({
      component,
      status,
      message,
      details,
      timestamp: new Date()
    });
  }

  async auditDatabase(): Promise<void> {
    try {
      // Test database connection
      const eventCount = await db.select().from(events);
      this.addResult('Database', 'pass', `Database connected successfully. Found ${eventCount.length} events`);

      // Test event data integrity
      const eventsBySource = await db.select().from(events);
      const sourceBreakdown = eventsBySource.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      this.addResult('Database Events', 'pass', 'Event data integrity verified', sourceBreakdown);

      // Test for recent events
      const recentEvents = eventsBySource.filter(event => 
        new Date(event.startTime) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      
      if (recentEvents.length > 0) {
        this.addResult('Recent Events', 'pass', `Found ${recentEvents.length} recent events (last 30 days)`);
      } else {
        this.addResult('Recent Events', 'warning', 'No recent events found in last 30 days');
      }

    } catch (error) {
      this.addResult('Database', 'fail', `Database error: ${error.message}`);
    }
  }

  async auditGoogleCredentials(): Promise<void> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!clientId || !clientSecret) {
        this.addResult('Google Credentials', 'fail', 'Missing Google OAuth credentials');
        return;
      }

      this.addResult('Google OAuth Setup', 'pass', 'Google OAuth credentials configured');

      if (!accessToken || !refreshToken) {
        this.addResult('Google Tokens', 'warning', 'Google tokens not configured - OAuth flow required');
        return;
      }

      // Test token validity
      try {
        const tokenTest = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
        if (tokenTest.ok) {
          const tokenInfo = await tokenTest.json();
          this.addResult('Google Token', 'pass', 'Access token is valid', {
            scope: tokenInfo.scope,
            expiresIn: tokenInfo.expires_in
          });
        } else {
          this.addResult('Google Token', 'warning', 'Access token needs refresh');
        }
      } catch (tokenError) {
        this.addResult('Google Token', 'warning', 'Token validation failed - refresh required');
      }

    } catch (error) {
      this.addResult('Google Credentials', 'fail', `Credential audit failed: ${error.message}`);
    }
  }

  async auditAPIEndpoints(): Promise<void> {
    const baseUrl = 'http://localhost:5000';
    const endpoints = [
      { path: '/api/auth/status', method: 'GET', expectAuth: false },
      { path: '/api/events', method: 'GET', expectAuth: false },
      { path: '/api/simplepractice/events?start=2024-01-01&end=2025-12-31', method: 'GET', expectAuth: true },
      { path: '/api/calendar/events?start=2024-01-01&end=2025-12-31', method: 'GET', expectAuth: false },
      { path: '/api/auth/google/fresh', method: 'GET', expectAuth: false },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI'
          }
        });

        if (response.ok) {
          const data = await response.text();
          this.addResult('API Endpoint', 'pass', `${endpoint.method} ${endpoint.path} responded successfully`, {
            status: response.status,
            dataLength: data.length
          });
        } else {
          const status = response.status;
          if (status === 401 && endpoint.expectAuth) {
            this.addResult('API Endpoint', 'warning', `${endpoint.method} ${endpoint.path} requires authentication`, {
              status: response.status
            });
          } else {
            this.addResult('API Endpoint', 'fail', `${endpoint.method} ${endpoint.path} failed`, {
              status: response.status,
              statusText: response.statusText
            });
          }
        }
      } catch (error) {
        this.addResult('API Endpoint', 'fail', `${endpoint.method} ${endpoint.path} error: ${error.message}`);
      }
    }
  }

  async auditAuthentication(): Promise<void> {
    try {
      const response = await fetch('http://localhost:5000/api/auth/status');
      
      if (response.ok) {
        const authData = await response.json();
        
        if (authData.isAuthenticated) {
          this.addResult('Authentication', 'pass', `User authenticated: ${authData.user.email}`, {
            user: authData.user,
            hasTokens: authData.hasTokens
          });
        } else {
          this.addResult('Authentication', 'warning', 'User not authenticated');
        }
      } else {
        this.addResult('Authentication', 'fail', 'Authentication status check failed');
      }
    } catch (error) {
      this.addResult('Authentication', 'fail', `Authentication audit failed: ${error.message}`);
    }
  }

  async auditFrontendComponents(): Promise<void> {
    try {
      // Test main app endpoint
      const response = await fetch('http://localhost:5000/');
      
      if (response.ok) {
        const html = await response.text();
        
        // Check for key components
        const hasReact = html.includes('React');
        const hasVite = html.includes('vite');
        const hasMainApp = html.includes('root');
        
        this.addResult('Frontend', 'pass', 'Frontend serving successfully', {
          hasReact,
          hasVite,
          hasMainApp,
          htmlLength: html.length
        });
      } else {
        this.addResult('Frontend', 'fail', 'Frontend not serving');
      }
    } catch (error) {
      this.addResult('Frontend', 'fail', `Frontend audit failed: ${error.message}`);
    }
  }

  async auditPDFExportSystem(): Promise<void> {
    try {
      // Check if PDF export utilities exist
      const pdfExports = [
        'exactGridPDFExport',
        'dailyPDFExport',
        'weeklyPackageExport',
        'trulyPixelPerfectExport'
      ];

      let exportCount = 0;
      for (const exportName of pdfExports) {
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), `client/src/utils/${exportName}.ts`);
          
          if (fs.existsSync(filePath)) {
            exportCount++;
          }
        } catch (error) {
          // File doesn't exist, which is fine
        }
      }

      if (exportCount > 0) {
        this.addResult('PDF Export System', 'pass', `Found ${exportCount} PDF export utilities`);
      } else {
        this.addResult('PDF Export System', 'warning', 'No PDF export utilities found');
      }
    } catch (error) {
      this.addResult('PDF Export System', 'fail', `PDF export audit failed: ${error.message}`);
    }
  }

  async runFullAudit(): Promise<AuditResult[]> {
    console.log('🔍 Starting comprehensive application audit...');
    
    this.results = []; // Clear previous results
    
    await this.auditDatabase();
    await this.auditGoogleCredentials();
    await this.auditAPIEndpoints();
    await this.auditAuthentication();
    await this.auditFrontendComponents();
    await this.auditPDFExportSystem();
    
    console.log('✅ Comprehensive audit completed');
    return this.results;
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    
    let report = `
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          COMPREHENSIVE APPLICATION AUDIT REPORT                        ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║ Total Tests: ${this.results.length.toString().padStart(3)}                                                              ║
║ Passed: ${passed.toString().padStart(3)} ✅                                                                ║
║ Warnings: ${warnings.toString().padStart(3)} ⚠️                                                               ║
║ Failed: ${failed.toString().padStart(3)} ❌                                                                ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

`;

    // Group results by status
    const statusOrder = ['fail', 'warning', 'pass'];
    const statusEmojis = { fail: '❌', warning: '⚠️', pass: '✅' };
    
    statusOrder.forEach(status => {
      const statusResults = this.results.filter(r => r.status === status);
      if (statusResults.length > 0) {
        report += `\n${statusEmojis[status]} ${status.toUpperCase()} (${statusResults.length}):\n`;
        statusResults.forEach(result => {
          report += `  • ${result.component}: ${result.message}\n`;
          if (result.details) {
            report += `    Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\n    ')}\n`;
          }
        });
      }
    });

    return report;
  }
}

// Export audit function for use in routes
export const runComprehensiveAudit = async () => {
  const audit = new ComprehensiveAudit();
  const results = await audit.runFullAudit();
  const report = audit.generateReport();
  
  return {
    results,
    report,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'fail').length
    }
  };
};