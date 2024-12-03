// INTEX Group 2-2

let express = require("express"); // Importing the express class/library

let app = express(); // Creating an express object

let path = require("path"); // Importing the path class/library

const port = process.env.PORT || 5000; // This port can change

app.set("view engine", "ejs"); // Telling the server that our web files will be EJS files

app.set("views", path.join(__dirname, "views")); // Telling the server where to find the views (web pages)

app.use(express.urlencoded({extended: true})); // Allows the server to work with the requests that are submitted

const knex = require("knex") ({ // Connecting to our Postgres Database
    client : "pg",
    connection : {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "admin", // This would need to change
        database : process.env.RDS_DB_NAME || "intex",
        port : process.env.RDS_PORT || 5432,
        ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});

app.get("/", (req, res) => {
        // Render the index.ejs template and pass the data
        res.render('index');
});

// Display the Event Request Form
app.get('/eventRequest', (req, res) => {
      res.render('eventRequest');
});

// Handle Event Request Form Submission
app.post('/eventRequest', (req, res) => {
  const {
    event_type,
    attendance_estimate,
    planned_date,
    possible_date_1,
    possible_date_2,
    start_time,               
    planned_hour_duration,    
    event_street_address,     
    event_city,               
    event_state,              
    event_zip,                
    contact_name,
    contact_phone,
    contact_email,
    story_flag
  } = req.body;

  // Prepare data for insertion
  const newEventRequest = {
    event_type: event_type || 'N',
    attendance_estimate: parseInt(attendance_estimate, 10) || 0,
    planned_date: planned_date || null,
    possible_date_1: possible_date_1 || null,
    possible_date_2: possible_date_2 || null,
    start_time: start_time || null, 
    planned_hour_duration: parseInt(planned_hour_duration, 10) || null, 
    event_street_address: event_street_address || '', 
    event_city: event_city || '', 
    event_state: event_state || 'NA', 
    event_zip: event_zip || '', 
    contact_name: contact_name || '',
    contact_phone: contact_phone || '',
    contact_email: contact_email || '',
    story_flag: story_flag === 'true'
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




// // Display the Volunteer Form
// app.get('/volunteerForm', (req, res) => {
//   knex('volunteers') // Fetch any necessary data (if needed)
//     .select('*')
//     .then(volunteers => {
//       res.render('volunteerForm', { volunteers });
//     })
//     .catch(error => {
//       console.error('Error fetching volunteer data:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

// // Handle Volunteer Form Submission
// app.post('/volunteerForm', (req, res) => {
//   const { first_name, last_name, email, availability, interests } = req.body; // Extract fields
//   knex('volunteers')
//     .insert({
//       first_name: first_name || '',
//       last_name: last_name || '',
//       email: email || '',
//       availability: availability || '',
//       interests: interests || ''
//     })
//     .then(() => {
//       res.redirect('/thankYou'); // Redirect to a thank-you page
//     })
//     .catch(error => {
//       console.error('Error submitting volunteer form:', error);
//       res.status(500).send('Internal Server Error');
//     });
// });

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