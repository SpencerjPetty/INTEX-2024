let express = require("express"); // Importing the express class/library
let session = require('express-session'); // Middleware for session management
let app = express(); // Creating an express object
let path = require("path"); // Importing the path class/library

const port = process.env.PORT || 9000; // This port can change

app.set("view engine", "ejs"); // Telling the server that our web files will be EJS files
app.set("views", path.join(__dirname, "views")); // Telling the server where to find the views (web pages)
app.use(express.urlencoded({extended: true})); // Allows the server to work with the requests that are submitted
app.use(express.json());

// Configure session middleware
app.use(
  session({
    secret: 'team22intex',   // Secret required to sign session ID cookie
    resave: false,           // Don't save session if not modified
    saveUninitialized: true, // Save unmodified sessions
    cookie: { secure: false }, // Set to true for HTTPS (false for local development)
  })
);

const knex = require("knex") ({ // Connecting to our Postgres Database
    client : "pg",
    connection : {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "eldonpostgressends", // This would need to change
        database : process.env.RDS_DB_NAME || "practiceLogin",
        port : process.env.RDS_PORT || 5432,
        ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});

// Render the login page with error message (if any)
app.get('/', (req, res) => {
  res.render('index', {
  });
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Query the database for the user record
    const user = await knex('admin_login').where({ username }).first();

    // Check if the user exists and the password matches
    if (user && user.password === password) {
      // Set session variable to indicate logged-in status
      req.session.isAuthenticated = true;
      req.session.username = user.username;

      // Redirect to internal landing page
      res.redirect('/internal');
    } else {
      // Authentication failed, set error message in session
      req.session.isAuthenticated = false;
      res.redirect('/internal')
    }
  } catch (error) {
    res.status(500).send('Database query failed: ' + error.message);
  }
});


// Internal route - only accessible to authenticated users
app.get('/internal', (req, res) => {
  // Check if the user is authenticated
  if (req.session.isAuthenticated) {
    res.send(`Welcome, ${req.session.username}! This is the internal landing page.`);
  } else {
    res.status(403).send('Access denied. Please log in.');
  }
});

app.listen(port, () => console.log("Express App has started and server is listening!"));


