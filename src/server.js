const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ExcelJS = require('exceljs'); 

const app = express();

// Enhanced Middleware setup
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Improved Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'Pranap',
  password: process.env.DB_PASSWORD || 'Pr@n@p#123',
  server: process.env.DB_SERVER || '192.168.4.40',
  port: parseInt(process.env.DB_PORT) || 8182,
  database: process.env.DB_NAME || 'IT_Time_Sheet',
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production', // Only true for development
    enableArithAbort: true,
    appName: 'Timesheet-App' // Helps identify the app in SQL Server logs
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Enhanced Database connection handling
let pool;
let dbConnectionRetries = 0;
const MAX_DB_RETRIES = 3;

const initializeDb = async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Database connection pool established successfully');
    
    pool.on('error', err => {
      console.error('Database pool error:', err);
      if (dbConnectionRetries < MAX_DB_RETRIES) {
        dbConnectionRetries++;
        console.log(`Attempting to reconnect (${dbConnectionRetries}/${MAX_DB_RETRIES})...`);
        setTimeout(initializeDb, 2000);
      }
    });
    
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    if (dbConnectionRetries < MAX_DB_RETRIES) {
      dbConnectionRetries++;
      console.log(`Retrying connection (${dbConnectionRetries}/${MAX_DB_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return initializeDb();
    }
    throw err;
  }
};

// Improved server startup
const startServer = async () => {
  try {
    await initializeDb();
    console.log('Database initialization complete');

    // Enhanced test route
    app.get('/test', (req, res) => {
      console.log('GET /test called');
      res.status(200).json({ 
        status: 'success',
        message: 'Test route working',
        database: pool.connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });
    console.log('Registered route: GET /test');

    // Enhanced health check
    app.get('/api/health', async (req, res) => {
      try {
        const dbCheck = await new sql.Request(pool).query('SELECT 1 as status');
        res.status(200).json({ 
          status: 'healthy',
          database: dbCheck.recordset.length ? 'connected' : 'disconnected',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        res.status(503).json({
          status: 'unhealthy',
          database: 'connection failed',
          error: err.message
        });
      }
    });
    console.log('Registered route: GET /api/health');

    // Enhanced login endpoint
    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      console.log('POST /api/login called with:', req.body);
    
      try {
        const result = await sql.query`
          SELECT Username, Team, IsActive, Role
          FROM Users
          WHERE Username = ${username} AND Password = ${password}
        `;
    
        if (result.recordset.length > 0) {
          const user = result.recordset[0];
          const isActive = Number(user.IsActive);
    
          if (isActive === 1) {
            console.log('Login successful for', username);
           //  sessionStorage.setItem('role', user.Role || 'User ');
            res.json({
              success: true,
              username: user.Username,
              team: user.Team,
              role: user.Role || 'User' // Include role in response
            });
          } else {
            res.json({ success: false, message: 'User is inactive' });
          }
        } else {
          res.json({ success: false, message: 'Invalid username or password' });
        }
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });


  
    app.get('/api/users', async (req, res) => {
      try {
        const request = new sql.Request(pool);
        const result = await request.query(`
          SELECT 
            UserID, 
            Username, 
            Team, 
            Role,
            IsActive
          FROM Users
          ORDER BY Username
        `);
        
        res.status(200).json({ 
          success: true, 
          users: result.recordset 
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Error fetching users.' 
        });
      }
    });


    // Update to handle role properly
app.post('/api/users', async (req, res) => {
  const { username, password, team, role } = req.body;

  if (!username || !password || !team || !role) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required.' 
    });
  }

  try {
    const request = new sql.Request(pool);
    await request
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(50), password)
      .input('team', sql.NVarChar(20), team)
      .input('role', sql.NVarChar(20), role === 'Admin' ? 'Admin' : 'User')
      .query(`
        INSERT INTO Users (Username, Password, IsActive, Team, Role)
        VALUES (@username, @password, 1, @team, @role)
      `);

    res.status(201).json({ 
      success: true, 
      message: 'User created successfully.' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating user.' 
    });
  }
});
    
    
        
    // Enhanced Activity Types endpoint
    app.get('/api/activityTypes', async (req, res) => {
      const { team } = req.query;
      console.log('GET /api/activityTypes called with team:', team);
    
      if (!team) {
        return res.status(400).json({ 
          success: false, 
          message: 'Team parameter is required',
          errorCode: 'MISSING_TEAM'
        });
      }
    
      try {
        const request = new sql.Request(pool);
        request.input('team', sql.NVarChar(50), team);
    
        const result = await request.query(`
          SELECT Id, ActivityName
          FROM ActivityTypes
          WHERE Team = @team AND IsActive = 1
          ORDER BY ActivityName
        `);
    
        res.status(200).json({ 
          success: true, 
          activityTypes: result.recordset,
          count: result.recordset.length
        });
      } catch (error) {
        console.error('Error fetching activity types:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Server error: ' + error.message,
          errorCode: 'SERVER_ERROR'
        });
      }
    });
    
    console.log('Registered route: GET /api/activityTypes');
    

    // Enhanced Timesheets endpoint
    app.post('/api/timesheets', async (req, res) => {
      try {
        const { username, team, entries } = req.body;
        console.log('POST /api/timesheets called with:', { 
          username, 
          team, 
          entriesCount: entries ? entries.length : 0 
        });

        // Validate input
        if (!username || !team) {
          return res.status(400).json({ 
            success: false,
            error: 'Missing required fields: username or team',
            errorCode: 'MISSING_FIELDS'
          });
        }

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ 
            success: false,
            error: 'No valid timesheet entries provided',
            errorCode: 'NO_ENTRIES'
          });
        }

        // Validate each entry
        const validationErrors = [];
        entries.forEach((entry, index) => {
          if (!entry.date || !entry.projectName || !entry.activityType || 
              !entry.activityPerformed || !entry.jobType || !entry.hoursSpent) {
            validationErrors.push(`Entry ${index + 1}: Missing required fields`);
          }
          
          const hours = parseFloat(entry.hoursSpent);
          if (isNaN(hours) || hours <= 0) {
            validationErrors.push(`Entry ${index + 1}: Invalid hours value`);
          }
        });

        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: validationErrors,
            errorCode: 'VALIDATION_FAILED'
          });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
          for (const entry of entries) {
            const request = new sql.Request(transaction);
            await request
              .input('username', sql.NVarChar(50), username)
              .input('team', sql.NVarChar(20), team)
              .input('date', sql.Date, new Date(entry.date))
              .input('projectName', sql.NVarChar(100), entry.projectName)
              .input('activityType', sql.NVarChar(50), entry.activityType)
              .input('activityPerformed', sql.NVarChar(500), entry.activityPerformed)
              .input('jobType', sql.NVarChar(20), entry.jobType)
              .input('hoursSpent', sql.Decimal(5, 2), parseFloat(entry.hoursSpent))
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
            error: err.message || 'Failed to save timesheet data',
            errorCode: 'TRANSACTION_ERROR'
          });
        }
      } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error',
          errorCode: 'SERVER_ERROR'
        });
      }
    });
    console.log('Registered route: POST /api/timesheets');

    // Endpoint to generate report
// Endpoint to generate report
app.get('/api/timesheet/report', async (req, res) => {
  const { startDate, endDate } = req.query;

  // Log the incoming request
  console.log('Report request received with:', { startDate, endDate });

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
  }

  try {
    const request = new sql.Request(pool);
    console.log('Fetching report for dates:', { startDate, endDate });

    const result = await request
      .input('startDate', sql.Date, new Date(startDate))
      .input('endDate', sql.Date, new Date(endDate))
      .query(`
        SELECT Username, Team, Date, ProjectName, ActivityType, ActivityPerformed, JobType, HoursSpent
        FROM Timesheets
        WHERE Date BETWEEN @startDate AND @endDate
      `);

    console.log('Report query result:', result.recordset); // Log the result

    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timesheet Report');

    // Add column headers
    worksheet.columns = [
      { header: 'Username', key: 'Username', width: 20 },
      { header: 'Team', key: 'Team', width: 20 },
      { header: 'Date', key: 'Date', width: 15 },
      { header: 'Project Name', key: 'ProjectName', width: 30 },
      { header: 'Activity Type', key: 'ActivityType', width: 20 },
      { header: 'Activity Performed', key: 'ActivityPerformed', width: 30 },
      { header: 'Job Type', key: 'JobType', width: 20 },
      { header: 'Hours Spent', key: 'HoursSpent', width: 15 },
    ];

    if (result.recordset.length > 0) {
      result.recordset.forEach(entry => {
        worksheet.addRow(entry);
      });
    } else {
      console.log('No records found for the given date range.');
      worksheet.addRow({ Username: 'No data found', Team: '', Date: '', ProjectName: '', ActivityType: '', ActivityPerformed: '', JobType: '', HoursSpent: '' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=timesheet_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Error generating report.' });
  }
});


// Endpoint to create a new user
app.post('/api/users', async (req, res) => {
  const { username, password, team, role } = req.body;

  if (!username || !password || !team || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const request = new sql.Request(pool);
    await request
      .input('username', sql.NVarChar(50), username)
      .input('password', sql.NVarChar(50), password) // Consider hashing passwords in production
      .input('team', sql.NVarChar(20), team)
      .input('role', sql.NVarChar(20), role)
      .query(`
        INSERT INTO Users (Username, Password, IsActive, Team, Role)
        VALUES (@username, @password, 1, @team, @role)
      `);

    res.status(201).json({ success: true, message: 'User  created successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
});



// Endpoint to delete a user
app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const request = new sql.Request(pool);
    await request
      .input('userId', sql.Int, userId)
      .query(`DELETE FROM Users WHERE UserID = @userId`);

    res.status(200).json({ success: true, message: 'User  deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});



// Endpoint to change a user's password
app.put('/api/users/:id/password', async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'New password is required.' });
  }

  try {
    const request = new sql.Request(pool);
    await request
      .input('userId', sql.Int, userId)
      .input('newPassword', sql.NVarChar(50), newPassword) // Consider hashing passwords in production
      .query(`UPDATE Users SET Password = @newPassword WHERE UserID = @userId`);

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Error changing password.' });
  }
});

    // Enhanced 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        errorCode: 'ENDPOINT_NOT_FOUND'
      });
    });

    // Enhanced error handling middleware
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        errorCode: 'UNHANDLED_ERROR'
      });
    });
    console.log('Registered error handling middleware');

    // Start server with better error handling
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Enhanced shutdown handling
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      try {
        await new Promise((resolve) => server.close(resolve));
        if (pool) await pool.close();
        console.log('Server and database connections closed');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled rejection:', err);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      shutdown();
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();