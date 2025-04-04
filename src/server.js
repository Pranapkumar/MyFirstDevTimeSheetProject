const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const dbConfig = {
  user: 'Pranap',
  password: 'Pr@n@p#123',
  server: '192.168.4.40',
  port: 8182,
  database: 'IT_Time_Sheet',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

// Test database connection
async function testConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server successfully');
    pool.close();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
testConnection();

// User Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT Username, IsActive 
        FROM Users 
        WHERE Username = @username AND Password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      if (user.IsActive) {
        // Update last login time
        await pool.request()
          .input('username', sql.NVarChar, username)
          .query('UPDATE Users SET LastLogin = GETDATE() WHERE Username = @username');
        
        res.status(200).json({ 
          success: true,
          message: 'Login successful',
          username: user.Username
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Account is inactive. Please contact administrator.'
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
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
    const pool = await sql.connect(dbConfig);
    const { username, entries } = req.body;
    
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      for (const entry of entries) {
        await transaction.request()
          .input('username', sql.VarChar, username)
          .input('date', sql.Date, entry.date)
          .input('projectName', sql.VarChar, entry.projectName)
          .input('activityType', sql.VarChar, entry.activityType)
          .input('activityPerformed', sql.VarChar, entry.activityPerformed)
          .input('jobType', sql.VarChar, entry.jobType)
          .input('hoursSpent', sql.Decimal, parseFloat(entry.hoursSpent))
          .query(`
            INSERT INTO Timesheets 
            (username, date, projectName, activityType, activityPerformed, jobType, hoursSpent)
            VALUES 
            (@username, @date, @projectName, @activityType, @activityPerformed, @jobType, @hoursSpent)
          `);
      }
      
      await transaction.commit();
      res.status(201).json({ message: 'Timesheet saved successfully' });
    } catch (err) {
      await transaction.rollback();
      console.error('Transaction error:', err);
      res.status(500).json({ error: 'Failed to save timesheet data' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});