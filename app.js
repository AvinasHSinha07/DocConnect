const express = require('express');
const bodyParser = require('body-parser');
const pool = require("./db");

pool.on('error', (err, client) => {
  console.error('Error in PostgreSQL pool:', err);
});

const app = express();
app.set('view engine', 'ejs')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3000);
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { root: __dirname });
});

app.get('/signup', (req, res) => {
  res.render('signup', { root: __dirname });
});
app.get('/login', (req, res) => {
  res.render('login', { root: __dirname });
});
app.get('/home', (req, res) => {
  res.render('home', { root: __dirname });
});
// Define the insertUserData function
const insertUserData = async (email, password) => {
  try {
    const query = 'INSERT INTO patients (email, password) VALUES ($1, $2)';
    const values = [email, password];
    const result = await pool.query(query, values);
    console.log('User data inserted successfully:', result.rowCount);
  } catch (error) {
    console.error('Error inserting user data:', error);
    throw error;
  }
};

// Define the checkIfEmailExists function
const checkIfEmailExists = async (email) => {
  try {
    const query = 'SELECT COUNT(*) FROM patients WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0].count > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
};

app.post('/register', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Check if the email is already registered (unique)
  const emailExists = await checkIfEmailExists(email);
  if (emailExists) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  // Check password complexity (e.g., minimum length)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password and confirm password do not match.' });
  }

  // If all checks pass, insert user data into the database
  try {
    await insertUserData(email, password);
    res.redirect('/login?accountCreated=true');
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'An error occurred while registering the user.' });
  }
});

app.post('/loggedin', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Query the database to check if the email and password match
  const query = 'SELECT * FROM patients WHERE email = $1 AND password = $2';
  const values = [email, password];

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 1) {
      // Successful login
      if (rememberMe) {
        // Set a persistent cookie (e.g., "remember_token")
        res.cookie('remember_token', 'some_unique_value', {
          // Set the cookie to expire in a long duration (e.g., 30 days)
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          httpOnly: true, // Cookie accessible only via HTTP
        });
      }
  
      // Redirect the user to the home page
      res.redirect('home');
    } else {
      // Invalid credentials
      res.status(401).json({ error: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});


app.use((req, res) => {
  res.render('404', { root: __dirname });
});
