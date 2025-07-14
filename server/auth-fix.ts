import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";

/**
 * COMPREHENSIVE AUTHENTICATION FIX
 * This module provides a complete solution for authentication issues
 */

export function setupAuthenticationFix(app: Express): void {
  console.log("🔧 APPLYING COMPREHENSIVE AUTHENTICATION FIX");

  // 1. Enhanced session debugging middleware
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    console.log(`\n=== REQUEST DEBUG [${req.method} ${req.path}] ===`);
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('User in req.user:', !!req.user);
    console.log('Session passport:', !!req.session?.passport);
    console.log('User ID:', req.user?.id);
    console.log('User email:', req.user?.email);
    
    if (req.user) {
      console.log('✅ User authenticated');
    } else {
      console.log('❌ No authenticated user');
    }
    
    next();
  });

  // 2. Enhanced authentication check middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    console.log('\n🔍 AUTHENTICATION CHECK');
    
    // Check multiple sources for user
    const user = req.user || req.session?.passport?.user;
    
    if (!user) {
      console.log('❌ Authentication failed - no user found');
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "Please authenticate via /api/auth/google",
        debug: {
          sessionId: req.sessionID,
          hasSession: !!req.session,
          hasPassport: !!req.session?.passport,
          hasUser: !!req.user
        }
      });
    }
    
    console.log('✅ Authentication successful:', user.email);
    next();
  };

  // 3. Apply authentication middleware to protected routes (excluding live-sync)
  app.use('/api/events', requireAuth);
  app.use('/api/calendar', (req, res, next) => {
    // Skip auth for live-sync endpoints
    if (req.path.startsWith('/live-sync')) {
      return next();
    }
    return requireAuth(req, res, next);
  });
  app.use('/api/simplepractice', requireAuth);
  app.use('/api/upload', requireAuth);

  // 4. OAuth callback handler is registered in `routes.ts` to avoid
  //    duplicate handlers causing conflicts. This placeholder is kept
  //    for backward compatibility but no longer registers its own
  //    callback route.

  // 5. Session recovery endpoint
  app.get('/api/auth/recover', (req, res) => {
    console.log('\n🔄 SESSION RECOVERY ATTEMPT');
    
    const sessionData = {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasPassport: !!req.session?.passport,
      hasUser: !!req.user,
      sessionData: req.session ? JSON.stringify(req.session, null, 2) : null
    };
    
    console.log('Session recovery data:', sessionData);
    res.json(sessionData);
  });

  // 6. Force authentication endpoint
  app.post('/api/auth/force-login', (req, res) => {
    console.log('\n🔄 FORCE LOGIN ATTEMPT');
    
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }
    
    // Manually set user in session
    const user = { id: userId, email: email };
    req.session.passport = { user: user };
    req.user = user;
    
    req.session.save((err) => {
      if (err) {
        console.error('❌ Force login session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('✅ Force login successful');
      res.json({ success: true, user: user });
    });
  });

  console.log("✅ COMPREHENSIVE AUTHENTICATION FIX APPLIED");
}

// Export authentication status checker
export function checkAuthStatus(req: Request): any {
  return {
    authenticated: !!req.user,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasPassport: !!req.session?.passport,
    user: req.user ? {
      id: req.user.id,
      email: req.user.email
    } : null
  };
}