let express = require("express"); // Importing the express class/library
let session = require('express-session'); // Middleware for session management
let app = express(); // Creating an express object
let path = require("path"); // Importing the path class/library

const port = process.env.PORT || 4444; // This port can change



app.set("view engine", "ejs"); // Telling the server that our web files will be EJS files
app.set("views", path.join(__dirname, "views")); // Telling the server where to find the views (web pages)
app.use(express.urlencoded({extended: true})); // Allows the server to work with the requests that are submitted
app.use(express.json());

app.use(express.static('public'));

// Configure session middleware
app.use(
  session({
    secret: 'team22intex',   // Secret required to sign session ID cookie
    resave: false,           // Don't save session if not modified
    saveUninitialized: true, // Save unmodified sessions
    cookie: { secure: false }, // Set to true for HTTPS (false for local development)
  })
);

// const knex = require("knex") ({ // Connecting to our Postgres Database
//     client : "pg",
//     connection : {
//         host : process.env.RDS_HOSTNAME || "localhost",
//         user : process.env.RDS_USERNAME || "postgres",
//         password : process.env.RDS_PASSWORD || "eldonpostgressends", // This would need to change
//         database : process.env.RDS_DB_NAME || "practiceLogin",
//         port : process.env.RDS_PORT || 5432,
//         ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
//     }
// });

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



app.get("/", (req, res) => {
//     knex('coding') // SQL query for collecting the data
//       .select(
//         'coding.id',
//         'coding.language_name',
//         'coding.created_year',
//         'coding.creator',
//         'coding.popularity_rank'
//       )
//       .first()
//       .then(codes => {
//         // Render the index.ejs template and pass the data
//         res.render('index', { codes });
//       })
//       .catch(error => {
//         console.error('Error querying database:', error);
//         res.status(500).send('Internal Server Error');
//       }); // res.send is for .html files, res.render is for .ejs files
res.render("index", { title: "TSP Landing Page" });
});

// Display the Event Request Form
app.get('/eventRequest', (req, res) => {
      res.render('eventRequest');
});

// Handle Event Request Form Submission
app.post('/eventRequest', (req, res) => {
  const {
    org_name,
    event_type,
    total_attendance_estimate,
    children_estimate,
    youth_estimate,
    adult_estimate,
    sewers_estimate,
    machine_estimate,
    table_type,
    room_size,
    planned_date,
    alt_date_1,
    alt_date_2,
    event_street_address,
    event_city,
    event_state,
    event_zip,
    start_time,
    planned_hour_duration,
    contact_name,
    contact_phone,
    contact_email,
    story_flag,
    story_length_minutes,
    donation_flag,
    donation_amount,
    event_status
  } = req.body;

  // Prepare data for insertion
  const newEventRequest = {
    org_name: org_name || null,
    event_type: event_type || 'N',
    total_attendance_estimate: parseInt(total_attendance_estimate, 10) || 0,
    children_estimate: parseInt(children_estimate, 10) || 0,
    youth_estimate: parseInt(youth_estimate, 10) || 0,
    adult_estimate: parseInt(adult_estimate, 10) || 0,
    sewers_estimate: parseInt(sewers_estimate, 10) || 0,
    machine_estimate: parseInt(machine_estimate, 10) || 0,
    table_type: table_type || 'R',
    room_size: room_size || 'M',
    planned_date: planned_date || null,
    alt_date_1: alt_date_1 || null,
    alt_date_2: alt_date_2 || null,
    event_street_address: event_street_address || '', 
    event_city: event_city || '', 
    event_state: event_state || null, 
    event_zip: event_zip || '', 
    start_time: start_time || null,
    planned_hour_duration: parseInt(planned_hour_duration, 10) || null, 
    contact_name: contact_name || '',
    contact_phone: contact_phone || '',
    contact_email: contact_email || '',
    story_flag: story_flag === 'true',
    story_length_minutes: parseInt(story_length_minutes, 10) || null,
    donation_flag: donation_flag === 'true',
    donation_amount: donation_flag === 'true' ? parseInt(donation_amount, 10) || null : null,
    event_status: event_status || 'P',
    time_submitted: new Date() // To capture the current timestamp when the form is submitted
  };

  // Insert into the database
    knex('event_details')
    .insert(newEventRequest)
    .then(() => {
        res.redirect('/');
    })
    .catch(error => {
      console.error('Error submitting event request:', error);
      res.status(500).send('Internal Server Error');
    });
});


// Display the Volunteer Form
app.get('/volunteerForm', (req, res) => {
  knex('referral_types') // Fetch any necessary data (if needed)
    .select('*')
    .then(ref_types => {
    res.render('volunteerForm', { ref_types });
    })
    .catch(error => {
        console.error('Error fetching referral types:', error);
        res.status(500).send('Internal Server Error');
    });
});

// Handle Volunteer Form Submission
app.post('/volunteerForm', (req, res) => {
const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone_number,
    email_address,
    street_address,
    city,
    event_state, // Matches the name in the HTML form for "state"
    zip,
    preferred_contact_method,
    referral_source_id,
    referral_other_text,
    sewing_level,
    estimated_hours_per_month,
    travel_mile_radius,
    willing_to_lead_flag,
    teach_sewing_flag
} = req.body;

  // Prepare Contact data
const newContact = {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    date_of_birth: date_of_birth,
    gender: gender || 'N',
    phone_number: phone_number.trim(),
    email_address: email_address.trim(),
    street_address: street_address || null,
    city: city || null,
    state: event_state || null,
    zip: zip || null,
    preferred_contact_method: preferred_contact_method || 'E',
    volunteer_flag: true // Indicates this contact is a volunteer
};

  // Insert into Contact table and retrieve contact_id
  knex('contact')
    .insert(newContact)
    .returning('contact_id')
    .then(contactIdArray => {
      const contact_id_num = contactIdArray[0].contact_id; // Explicitly extract the contact_id field

      // Prepare Volunteer data
      const newVolunteer = {
        contact_id: contact_id_num,
        referral_source_id: parseInt(referral_source_id, 10) || null,
        referral_other_text: referral_other_text || null,
        sewing_level: sewing_level || 'B',
        estimated_hours_per_month: parseInt(estimated_hours_per_month, 10) || 0,
        date_joined: new Date(), // Automatically populate the date joined
        travel_mile_radius: travel_mile_radius || null,
        willing_to_lead_flag: willing_to_lead_flag || false,
        teach_sewing_flag: teach_sewing_flag || false
      };

      // Insert into Volunteer table
      return knex('volunteer').insert(newVolunteer);
    })
    .then(() => {
      res.redirect('/'); // Redirect to the home page on successful submission
    })
    .catch(error => {
      console.error('Error submitting volunteer form:', error);
      res.status(500).send('Internal Server Error');
    });
});




// // Admin Landing Page (Protected)
// app.get('/admin', (req, res) => {
//   if (!req.isAuthenticated()) { // Assuming `req.isAuthenticated()` checks login status
//     return res.redirect('/login'); // Redirect to login page if not authenticated
//   }

//   // Fetch Event Requests and Volunteer Submissions for Admin Dashboard
//   Promise.all([
//     knex('event_request').select('*'),
//     knex('volunteers').select('*')
//   ])
//     .then(([eventRequests, volunteers]) => {
//       res.render('adminDashboard', { eventRequests, volunteers });
//     })
//     .catch(error => {
//       console.error('Error fetching admin data:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

// // Route to Delete Event Request
// app.post('/admin/deleteEventRequest/:id', (req, res) => {
//   const id = req.params.id;
//   knex('event_request')
//     .where('id', id)
//     .del()
//     .then(() => {
//       res.redirect('/admin'); // Redirect back to admin page
//     })
//     .catch(error => {
//       console.error('Error deleting event request:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

// // Route to Delete Volunteer
// app.post('/admin/deleteVolunteer/:id', (req, res) => {
//   const id = req.params.id;
//   knex('volunteers')
//     .where('id', id)
//     .del()
//     .then(() => {
//       res.redirect('/admin'); // Redirect back to admin page
//     })
//     .catch(error => {
//       console.error('Error deleting volunteer:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });


app.listen(port, () => console.log("Express App has started and server is listening!"));

