import type { Express, Request, Response } from "express";
import { storage } from "./storage";

interface AuditResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  fix?: string;
}

interface ComprehensiveAudit {
  timestamp: string;
  results: AuditResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
}

export class AuthenticationAuditSystem {
  private results: AuditResult[] = [];

  private addResult(component: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any, fix?: string) {
    this.results.push({ component, status, message, details, fix });
  }

  async auditEnvironmentVariables(): Promise<void> {
    console.log("🔍 Auditing Environment Variables...");
    
    // Check Google OAuth credentials
    if (!process.env.GOOGLE_CLIENT_ID) {
      this.addResult('Environment', 'FAIL', 'GOOGLE_CLIENT_ID is missing', null, 'Add GOOGLE_CLIENT_ID to environment variables');
    } else {
      this.addResult('Environment', 'PASS', 'GOOGLE_CLIENT_ID is configured');
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      this.addResult('Environment', 'FAIL', 'GOOGLE_CLIENT_SECRET is missing', null, 'Add GOOGLE_CLIENT_SECRET to environment variables');
    } else {
      this.addResult('Environment', 'PASS', 'GOOGLE_CLIENT_SECRET is configured');
    }

    // Check database connection
    if (!process.env.DATABASE_URL) {
      this.addResult('Database', 'FAIL', 'DATABASE_URL is missing', null, 'Configure DATABASE_URL for session storage');
    } else {
      this.addResult('Database', 'PASS', 'DATABASE_URL is configured');
    }

    // Check session secret
    if (!process.env.SESSION_SECRET) {
      this.addResult('Session', 'WARNING', 'SESSION_SECRET not configured, using default', null, 'Set SESSION_SECRET for production security');
    } else {
      this.addResult('Session', 'PASS', 'SESSION_SECRET is configured');
    }
  }

  async auditDatabaseConnection(): Promise<void> {
    console.log("🔍 Auditing Database Connection...");
    
    try {
      // Test database connection
      const testUser = await storage.getUserById(1);
      this.addResult('Database', 'PASS', 'Database connection successful', { userFound: !!testUser });
    } catch (error) {
      this.addResult('Database', 'FAIL', 'Database connection failed', { error: error.message }, 'Check DATABASE_URL and database status');
    }
  }

  async auditSessionStore(req: Request): Promise<void> {
    console.log("🔍 Auditing Session Store...");
    
    // Check session existence
    if (!req.session) {
      this.addResult('Session', 'FAIL', 'Session object is missing', null, 'Check session middleware configuration');
      return;
    }

    // Check session ID
    if (!req.sessionID) {
      this.addResult('Session', 'FAIL', 'Session ID is missing', null, 'Session middleware not properly initialized');
    } else {
      this.addResult('Session', 'PASS', 'Session ID exists', { sessionId: req.sessionID });
    }

    // Check session data
    const sessionData = JSON.parse(JSON.stringify(req.session));
    this.addResult('Session', 'PASS', 'Session data structure', { 
      data: sessionData,
      hasPassport: !!req.session.passport,
      hasUser: !!req.user
    });
  }

  async auditPassportConfiguration(): Promise<void> {
    console.log("🔍 Auditing Passport Configuration...");
    
    // Check if passport is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      this.addResult('Passport', 'FAIL', 'Passport cannot be configured without Google OAuth credentials');
      return;
    }

    this.addResult('Passport', 'PASS', 'Passport configuration appears valid');
  }

  async auditUserAuthentication(req: Request): Promise<void> {
    console.log("🔍 Auditing User Authentication...");
    
    // Check req.user
    if (!req.user) {
      this.addResult('Authentication', 'FAIL', 'No user in request object', null, 'User needs to authenticate via /api/auth/google');
    } else {
      this.addResult('Authentication', 'PASS', 'User authenticated', { 
        userId: req.user.id,
        email: req.user.email,
        hasAccessToken: !!(req.user as any).accessToken
      });
    }

    // Check session passport
    if (!req.session?.passport?.user) {
      this.addResult('Authentication', 'FAIL', 'No passport user in session', null, 'Authentication session is broken');
    } else {
      this.addResult('Authentication', 'PASS', 'Passport user in session', { 
        user: req.session.passport.user 
      });
    }
  }

  async auditGoogleAPIAccess(req: Request): Promise<void> {
    console.log("🔍 Auditing Google API Access...");
    
    const user = req.user as any;
    if (!user?.accessToken) {
      this.addResult('Google API', 'FAIL', 'No access token available', null, 'User must re-authenticate with Google');
      return;
    }

    try {
      // Test Google Calendar API access
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.calendarList.list({ maxResults: 1 });
      
      this.addResult('Google API', 'PASS', 'Google Calendar API access successful', { 
        calendarsFound: response.data.items?.length || 0 
      });
    } catch (error) {
      this.addResult('Google API', 'FAIL', 'Google Calendar API access failed', { 
        error: error.message 
      }, 'Check access token validity or re-authenticate');
    }
  }

  async runComprehensiveAudit(req: Request): Promise<ComprehensiveAudit> {
    console.log("🚀 Starting Comprehensive Authentication Audit...");
    this.results = [];

    // Run all audit checks
    await this.auditEnvironmentVariables();
    await this.auditDatabaseConnection();
    await this.auditSessionStore(req);
    await this.auditPassportConfiguration();
    await this.auditUserAuthentication(req);
    await this.auditGoogleAPIAccess(req);

    // Generate summary
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length
    };

    // Generate recommendations
    const recommendations = this.results
      .filter(r => r.fix)
      .map(r => `${r.component}: ${r.fix}`);

    const audit: ComprehensiveAudit = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary,
      recommendations
    };

    console.log("📊 Audit Summary:", summary);
    console.log("🔧 Recommendations:", recommendations);

    return audit;
  }

  async autoFix(req: Request): Promise<string[]> {
    console.log("🔧 Attempting Auto-Fix...");
    const fixes: string[] = [];

    // Run audit first
    await this.runComprehensiveAudit(req);

    // Auto-fix common issues
    for (const result of this.results) {
      if (result.status === 'FAIL') {
        switch (result.component) {
          case 'Authentication':
            if (result.message.includes('No user in request object')) {
              fixes.push('Redirecting to Google OAuth authentication');
              // This would be handled by the frontend
            }
            break;
        }
      }
    }

    return fixes;
  }
}

export function setupAuditRoutes(app: Express): void {
  const auditSystem = new AuthenticationAuditSystem();

  // Comprehensive audit endpoint
  app.get('/api/audit/comprehensive', async (req, res) => {
    try {
      const audit = await auditSystem.runComprehensiveAudit(req);
      res.json(audit);
    } catch (error) {
      res.status(500).json({ error: 'Audit failed', details: error.message });
    }
  });

  // Auto-fix endpoint
  app.post('/api/audit/autofix', async (req, res) => {
    try {
      const fixes = await auditSystem.autoFix(req);
      res.json({ fixes, message: 'Auto-fix completed' });
    } catch (error) {
      res.status(500).json({ error: 'Auto-fix failed', details: error.message });
    }
  });

  // Quick health check
  app.get('/api/audit/health', async (req, res) => {
    const health = {
      timestamp: new Date().toISOString(),
      server: 'running',
      database: 'unknown',
      authentication: 'unknown',
      session: !!req.session,
      user: !!req.user
    };

    try {
      await storage.getUserById(1);
      health.database = 'connected';
    } catch {
      health.database = 'disconnected';
    }

    health.authentication = req.user ? 'authenticated' : 'not_authenticated';

    res.json(health);
  });
}