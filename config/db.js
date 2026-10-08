const mysql = require('mysql2');

// Connection pool. Values come from .env so no password lives in the code.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trooper',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined, // set DB_SSL=true for hosted databases that require TLS
  dateStrings: true // DATE, TIME and DATETIME come back as text, so no timezone surprises
});

module.exports = pool.promise();
