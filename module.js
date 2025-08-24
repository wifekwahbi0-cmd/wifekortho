// Module factory function that accepts APP_ID as parameter
module.exports = function createAppModule(APP_ID) {
  const express = require('express');
  const path = require('path');
  const fs = require('fs');

  const app = express();

  // ===== SMART ROUTING DETECTION =====
  // Detect if running standalone (server.js) or embedded (parent server)
  const IS_EMBEDDED = global.PARENT_SERVER_MODE || process.env.EMBEDDED_MODE;
  const API_BASE = IS_EMBEDDED ? `/api/${APP_ID}` : '';

  // ===== BASIC MIDDLEWARE =====
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('.'));

  // ===== CORS SUPPORT =====
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // ===== SPEECH THERAPY APP FEATURES =====
  
  // Game progress tracking
  let gameProgress = {
    totalScore: 0,
    totalStars: 0,
    completedGames: 0,
    playTime: 0,
    achievements: 0,
    gamesPlayed: []
  };

  // Save game progress
  app.post(`${API_BASE}/progress`, (req, res) => {
    try {
      const { score, stars, gameType, duration } = req.body;
      
      gameProgress.totalScore += score || 0;
      gameProgress.totalStars += stars || 0;
      gameProgress.playTime += duration || 0;
      
      if (gameType && !gameProgress.gamesPlayed.includes(gameType)) {
        gameProgress.completedGames++;
        gameProgress.gamesPlayed.push(gameType);
      }
      
      // Check for achievements
      if (gameProgress.totalScore >= 100) gameProgress.achievements++;
      if (gameProgress.completedGames >= 3) gameProgress.achievements++;
      if (gameProgress.totalStars >= 10) gameProgress.achievements++;
      
      res.json({ 
        success: true, 
        progress: gameProgress 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get game progress
  app.get(`${API_BASE}/progress`, (req, res) => {
    res.json(gameProgress);
  });

  // Reset progress (for testing)
  app.post(`${API_BASE}/reset-progress`, (req, res) => {
    gameProgress = {
      totalScore: 0,
      totalStars: 0,
      completedGames: 0,
      playTime: 0,
      achievements: 0,
      gamesPlayed: []
    };
    res.json({ success: true, message: 'تم إعادة تعيين التقدم بنجاح' });
  });

  // Game content endpoints
  app.get(`${API_BASE}/letters`, (req, res) => {
    const arabicLetters = [
      'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
    ];
    res.json({ letters: arabicLetters });
  });

  app.get(`${API_BASE}/colors`, (req, res) => {
    const colors = [
      { name: 'أحمر', color: '#ef4444', emoji: '🔴' },
      { name: 'أزرق', color: '#3b82f6', emoji: '🔵' },
      { name: 'أخضر', color: '#10b981', emoji: '🟢' },
      { name: 'أصفر', color: '#f59e0b', emoji: '🟡' },
      { name: 'بنفسجي', color: '#8b5cf6', emoji: '🟣' },
      { name: 'برتقالي', color: '#f97316', emoji: '🟠' },
      { name: 'وردي', color: '#ec4899', emoji: '🩷' },
      { name: 'بني', color: '#a3a3a3', emoji: '🤎' }
    ];
    res.json({ colors });
  });

  app.get(`${API_BASE}/stories`, (req, res) => {
    const stories = [
      {
        id: 1,
        title: 'القطة الصغيرة',
        content: 'كان هناك قطة صغيرة تحب اللعب في الحديقة. كل يوم تجري وتلعب مع الفراشات الملونة.',
        image: '🐱',
        moral: 'اللعب والمرح مهمان للنمو الصحي'
      },
      {
        id: 2,
        title: 'الأرنب السريع',
        content: 'أرنب صغير يحب الجزر كثيراً. يقفز ويلعب مع أصدقائه في المرج الأخضر.',
        image: '🐰',
        moral: 'الأصدقاء يجعلون الحياة أجمل'
      },
      {
        id: 3,
        title: 'النحلة المجتهدة',
        content: 'نحلة صغيرة تطير من زهرة إلى زهرة لتجمع العسل اللذيذ لأصدقائها.',
        image: '🐝',
        moral: 'العمل الجاد يؤدي إلى النجاح'
      }
    ];
    res.json({ stories });
  });

  // Game statistics
  app.get(`${API_BASE}/stats`, (req, res) => {
    const stats = {
      totalGamesAvailable: 6,
      averageScore: gameProgress.completedGames > 0 ? Math.round(gameProgress.totalScore / gameProgress.completedGames) : 0,
      completionRate: Math.round((gameProgress.completedGames / 6) * 100),
      playTimeMinutes: Math.round(gameProgress.playTime / 60),
      achievements: gameProgress.achievements
    };
    res.json(stats);
  });

  // ===== DEFAULT ROUTES =====
  // Serve the main HTML file
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Health check endpoint
  app.get(`${API_BASE}/health`, (req, res) => {
    const health = {
      status: 'ok', 
      appId: APP_ID,
      mode: IS_EMBEDDED ? 'embedded' : 'standalone',
      timestamp: new Date().toISOString(),
      appName: 'وفيق أورثو - العلاج النطقي للأطفال',
      version: '1.0.0',
      // Environment info (useful for debugging)
      env: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    res.json(health);
  });

  // ===== ERROR HANDLING =====
  app.use((err, req, res, next) => {
    console.error('App error:', err);
    
    // Report error to parent server when running in embedded mode
    if (IS_EMBEDDED && typeof process.emitAppError === 'function') {
      try {
        let errorType = 'runtime_error';
        if (err.statusCode >= 400 && err.statusCode < 500) {
          errorType = 'client_error';
        } else if (err.statusCode >= 500) {
          errorType = 'server_error';
        }
        
        const errorDetails = {
          type: errorType,
          message: err.message || 'Unknown error',
          name: err.name,
          stack: err.stack,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: err.statusCode || err.status || 500,
          timestamp: new Date().toISOString()
        };
        
        process.emitAppError(APP_ID, errorDetails);
      } catch (reportError) {
        console.error('Failed to report error to parent server:', reportError);
      }
    }
    
    if (!res.headersSent) {
      res.status(err.statusCode || err.status || 500).json({ 
        success: false,
        error: 'حدث خطأ في الخادم',
        message: err.message || 'حدث خطأ أثناء معالجة طلبك'
      });
    }
  });

  return app;
};