const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://your-frontend-domain.com'], // Replace with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'Pranap',
  password: process.env.DB_PASSWORD || 'Pr@n@p#123',
  server: process.env.DB_SERVER || '192.168.4.40',
  port: parseInt(process.env.DB_PORT) || 8182,
  database: process.env.DB_NAME || 'IT_Time_Sheet',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Database connection pool
let pool;
const initializeDb = async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Database connection pool established');
    pool.on('error', err => {
      console.error('Database connection pool error:', err);
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
};
initializeDb();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username and password are required'
      });
    }

    const request = new sql.Request(pool);
    const result = await request
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(100), password)
      .query(`
        SELECT UserID, Username, IsActive, Team 
        FROM Users 
        WHERE Username = @username AND Password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = result.recordset[0];
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Update last login time
    await new sql.Request(pool)
      .input('username', sql.NVarChar(50), username)
      .query('UPDATE Users SET LastLogin = GETDATE() WHERE Username = @username');
    
    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user.UserID,
        username: user.Username,
        team: user.Team
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
});

// API endpoint to save timesheet
app.post('/api/timesheets', async (req, res) => {
  try {
    const { username, team, entries } = req.body;
    
    // Input validation
    if (!username || !team || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ 
        error: 'Invalid request. Missing required fields.' 
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({ 
        error: 'No timesheet entries provided' 
      });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      for (const [index, entry] of entries.entries()) {
        // Validate each entry
        if (!entry.date || !entry.projectName || !entry.activityType || 
            !entry.activityPerformed || !entry.jobType || !entry.hoursSpent) {
          throw new Error(`Missing required fields in entry ${index + 1}`);
        }

        const hours = parseFloat(entry.hoursSpent);
        if (isNaN(hours)) {
          throw new Error(`Invalid hours value in entry ${index + 1}`);
        }

        const request = new sql.Request(transaction);
        await request
          .input('username', sql.VarChar(50), username)
          .input('team', sql.VarChar(20), team)
          .input('date', sql.Date, new Date(entry.date))
          .input('projectName', sql.VarChar(100), entry.projectName)
          .input('activityType', sql.VarChar(50), entry.activityType)
          .input('activityPerformed', sql.VarChar(500), entry.activityPerformed)
          .input('jobType', sql.VarChar(20), entry.jobType)
          .input('hoursSpent', sql.Decimal(5, 2), hours)
          .query(`
            INSERT INTO Timesheets 
            (username, team, date, projectName, activityType, activityPerformed, jobType, hoursSpent)
            VALUES 
            (@username, @team, @date, @projectName, @activityType, @activityPerformed, @jobType, @hoursSpent)
          `);
      }
      
      await transaction.commit();
      res.status(201).json({ 
        success: true,
        message: 'Timesheet saved successfully',
        entriesSaved: entries.length
      });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(400).json({ 
        success: false,
        error: err.message || 'Failed to save timesheet data'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    pool.close().then(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    pool.close().then(() => {
      console.log('Database connection pool closed');
      process.exit(0);
    });
  });
});