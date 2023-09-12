const Pool = require("pg").Pool;
const pool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "localhost",
    database: "DocConnect",
    queueLimit : 0,
    connectionLimit : 0 
});
pool.on('error', (err, client) => {
    console.error('Error in PostgreSQL pool:', err);
});
module.exports = pool;
// Example usage of the insertUserData function


