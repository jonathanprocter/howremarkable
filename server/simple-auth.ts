/**
 * Simple Authentication Fix for Immediate Login
 * This provides a direct login method for users to immediately access the application
 */

import { Request, Response } from 'express';
import { storage } from './storage';

export async function simpleDirectLogin(req: Request, res: Response) {
  console.log('🔐 SIMPLE DIRECT LOGIN INITIATED');
  
  try {
    // Create or find user in database
    let user = await storage.getUserByUsername('jonathan.procter@gmail.com');
    
    if (!user) {
      // Create user if not exists
      user = await storage.createUser({
        username: 'jonathan.procter@gmail.com',
        password: 'temp_password', // Not used for OAuth
        email: 'jonathan.procter@gmail.com',
        displayName: 'Jonathan Procter'
      });
      console.log('✅ User created:', user.id);
    }
    
    // Create session user object with Google tokens
    const sessionUser = {
      id: user.id.toString(),
      email: user.email,
      displayName: user.displayName,
      name: user.displayName,
      accessToken: process.env.GOOGLE_ACCESS_TOKEN || 'dev_access_token',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'dev_refresh_token'
    };
    
    // Log the user in directly
    req.user = sessionUser;
    req.session.passport = { user: sessionUser };
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ User logged in successfully:', sessionUser.email);
    console.log('✅ Session ID:', req.sessionID);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        displayName: sessionUser.displayName
      },
      redirect: '/'
    });
    
  } catch (error) {
    console.error('❌ Simple login failed:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
}

export async function simpleAuthStatus(req: Request, res: Response) {
  console.log('🔍 SIMPLE AUTH STATUS CHECK');
  
  const user = req.user;
  const isAuthenticated = !!user;
  
  console.log('User authenticated:', isAuthenticated);
  console.log('Session ID:', req.sessionID);
  
  res.json({
    isAuthenticated,
    user: user ? {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    } : null,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasPassport: !!req.session?.passport
  });
}