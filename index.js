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

const knex = require("knex") ({ // Connecting to our Postgres Database
    client : "pg",
    connection : {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "eldonpostgressends", // This would need to change
        // set password to admin and database to intex before committing
        database : process.env.RDS_DB_NAME || "practiceLogin",
        port : process.env.RDS_PORT || 5432,
        ssl : process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});

app.get('/login', (req, res) => {
res.render('login', {})
});

app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // if (!username || !password) { return res.status(400).send("Username and password are required."); }

    try {
        // Query the database for the user record
        const user = await knex('admin_login').where({ username }).first();

    // Check if the user exists and the password matches
    if (user && user.password === password) {
      // Set session variable to indicate logged-in status
        req.session.isAuthenticated = true;
        req.session.username = user.username;

      // Redirect to internal landing page
        res.redirect('/admin');
    } else {
      // Authentication failed, set error message in session
        req.session.isAuthenticated = false;
        res.redirect('/login')
    }
    } catch (error) {
    res.status(500).send('Database query failed: ' + error.message);
    }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Logout error:', err);
          res.status(500).send('Unable to log out');
      } else {
          res.redirect('/'); // Redirect to home page after logout
      }
  });
});


app.get("/", (req, res) => {
res.render("index", { title: "TSP Landing Page" });
});

app.get('/admin/manageAdmins', (req, res) => {
  knex('admin') 
    .join('admin_login', 'admin.contact_id', 'admin_login.contact_id')
    .join('contact', 'admin.contact_id', 'contact.contact_id')// Querying the admin details table
    .select(
      'admin_login.username',
      'contact.first_name',
      'contact.last_name',
      'contact.date_of_birth',
      'contact.gender',
      'contact.phone_number',
      'contact.email_address',
      'contact.city',
      'contact.state',
      'contact.preferred_contact_method',
      'admin.created_by',
      'admin.created_date',
      'admin.contact_id'
    )
    .orderBy('contact.last_name', 'asc')
    .orderBy('contact.first_name', 'asc') // Sort by first and last name in ascending order
    .then(admins => {
      // Render the manageAdmins.ejs template and pass the data
      res.render('manageAdmins', { admins });
    })
    .catch(error => {
      console.error('Error querying database:', error);
      res.status(500).send('Internal Server Error');
    }); // Error handling for Knex queries
});

// main admin page 
// if (req.session.isAuthenticated) {
//  res.send(`Welcome, ${req.session.username}! This is the internal landing page.`);
// } else {
//  res.status(403).send('Access denied. Please log in.');
// }

app.get('/admin', (req, res) => {
  res.render('admin', {})
});

app.get('/admin/editAdmin/:id', (req, res) => {
  let id = req.params.id;
  // Query the Admin by ID first
  knex('admin') 
    .join('admin_login', 'admin.contact_id', 'admin_login.contact_id')
    .join('contact', 'admin.contact_id', 'contact.contact_id')
    .where('admin.contact_id', id)
    .first()
    .then(admins => {
      // Render the adminEditAdmin.ejs template and pass the data
      res.render('adminEditAdmin', { admins });
    })
    .catch(error => {
      console.error('Error fetching Admin for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.post('/admin/editAdmin/:id', (req, res) => {
  const id = req.params.id;
  // Access each value directly from req.body
  const created_by = req.body.created_by;
  const created_date = req.body.created_date;
  const username = req.body.username;
  const password = req.body.password;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const date_of_birth = req.body.date_of_birth;
  const gender = req.body.gender;
  const phone_number = req.body.phone_number;
  const email_address = req.body.email_address;
  const street_address = req.body.street_address;
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.zip;
  const preferred_contact_method = req.body.preferred_contact_method;
  // Update the admin in the database
  knex('admin')
  .where('contact_id', id)
  .update({
    created_by: created_by,
    created_date: created_date
  })
  .then(() => {
    // Update the `admin_login` table
    return knex('admin_login')
      .where('contact_id', id)
      .update({
        username: username,
        password: password,
      });
  })
  .then(() => {
    // Update the `contact` table
    return knex('contact')
      .where('contact_id', id)
      .update({
        first_name: first_name,
        last_name: last_name,
        date_of_birth: date_of_birth,
        gender: gender,
        phone_number: phone_number,
        email_address: email_address,
        street_address: street_address,
        city: city,
        state: state,
        zip: zip,
        preferred_contact_method: preferred_contact_method
      });
  })
  .then(() => {
    res.redirect('/admin/manageAdmins');
  })
  .catch(error => {
    console.error('Error updating Admin:', error);
    res.status(500).send('Internal Server Error');
  });
});

// Route to Delete admin account
app.post('/admin/deleteAdmin/:id', (req, res) => {
  const id = req.params.id; // Extract the id from the URL parameter

  knex.transaction(trx => {
    // Step 1: Delete from admin table
    return trx('admin')
      .where('contact_id', id)
      .del()
      .then(() => {
        // Step 2: Delete from admin_login table
        return trx('admin_login')
          .where('contact_id', id)
          .del();
      })
      .then(() => {
        // Step 3: Delete from contact table
        return trx('contact')
          .where('contact_id', id)
          .del();
      });
  })
  .then(() => {
    res.redirect('/admin/manageAdmins'); // Redirect after successful deletion
  })
  .catch(error => {
    console.error('Error deleting admin record:', error);
    res.status(500).send('Internal Server Error');
  });
});

// Get Add Admin page
app.get('/admin/addAdmin', (req, res) => {
  knex('admin_login') // Fetch any necessary data (if needed)
    .select('username', 'contact_id')
    .then(usernames => {
    res.render('adminAddAdmin', { usernames });
    })
    .catch(error => {
        console.error('Error fetching usernames:', error);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/admin/addAdmin', (req, res) => {
  const {
    created_by,
    username,
    password,
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone_number,
    email_address,
    street_address,
    city,
    state,
    zip,
    preferred_contact_method
  } = req.body; 
  // Prepare Contact data
  const newAdminContact = {
    first_name: first_name,
    last_name: last_name,
    date_of_birth: date_of_birth,
    gender: gender || 'N',
    phone_number: phone_number,
    email_address: email_address,
    street_address: street_address || null,
    city: city || null,
    state: state || null,
    zip: zip || null,
    preferred_contact_method: preferred_contact_method || 'E',
    volunteer_flag: false // Default to 'E' if not provided
  };
  // Insert into Contact table and retrieve contact_id
  knex('contact')
    .insert(newAdminContact)
    .returning('contact_id')
    .then(contactIdArray => {
      const contact_id = contactIdArray[0].contact_id; // Explicitly extract the contact_id field

      // Prepare Admin Login data
      const newAdminLogin = {
        contact_id: contact_id,
        username: username,
        password: password,
      };

      // Insert into Admin Login table
      return knex('admin_login')
        .insert(newAdminLogin)
        .then(() => {
          // Prepare Admin data
          const newAdmin = {
            contact_id: contact_id,
            created_by: created_by,
            created_date: new Date() // Automatically capture the timestamp when the form is submitted
          };

          // Insert into Admin table
          return knex('admin')
            .insert(newAdmin);
        });
    })
    .then(() => {
        res.redirect('/admin/manageAdmins'); // Redirect to manage events after successful insertion
    })
    .catch(error => {
        console.error('Error submitting admin form:', error);
      res.status(500).send('Internal Server Error');
    });
});

// test
app.get('/manageEvents', (req, res) => {
  res.redirect('/admin/manageEvents'); 
});

// Display the Event Request Form
app.get('/eventRequest', (req, res) => {
      res.render('eventRequest');
});

// Display the Event Request Form
app.get('/admin/addAdmin', (req, res) => {
  res.render('adminAddAdmin');
});

app.get('/admin/addEvent', (req, res) => {
  res.render('adminAddEvent');
});

// Handle Add Event form
app.post('/admin/addEvent', (req, res) => {
  const {
    created_by,
    username,
    password,
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone_number,
    email_address,
    street_address,
    city,
    state,
    zip,
    preferred_contact_method
  } = req.body;

  // Prepare Contact data
  const newAdminContact = {
    first_name: first_name,
    last_name: last_name,
    date_of_birth: date_of_birth,
    gender: gender || 'N',
    phone_number: phone_number,
    email_address: email_address,
    street_address: street_address || null,
    city: city || null,
    state: state || null,
    zip: zip || null,
    preferred_contact_method: preferred_contact_method || 'E',
    volunteer_flag: false // Default to 'E' if not provided
  };

  // Insert into Contact table and retrieve contact_id
  knex('contact')
    .insert(newAdminContact)
    .returning('contact_id')
    .then(contactIdArray => {
      const contact_id = contactIdArray[0].contact_id; // Explicitly extract the contact_id field

      // Prepare Admin Login data
      const newAdminLogin = {
        contact_id: contact_id,
        username: username,
        password: password,
      };

      // Insert into Admin Login table
      return knex('admin_login')
        .insert(newAdminLogin)
        .then(() => {
          // Prepare Admin data
          const newAdmin = {
            contact_id: contact_id,
            created_by: created_by,
            created_date: new Date() // Automatically capture the timestamp when the form is submitted
          };

          // Insert into Admin table
          return knex('admin')
            .insert(newAdmin);
        });
    })
    .then(() => {
      res.redirect('/admin/manageAdmins'); // Redirect to manage events after successful insertion
    })
    .catch(error => {
      console.error('Error submitting admin form:', error);
      res.status(500).send('Internal Server Error');
    });
});


// Getting the Edit Event page
app.get('/admin/editEvent/:id', (req, res) => {
  let id = req.params.id;

  // Query the event by ID
  knex('event_details')  // Assuming your table is named 'event_details'
    .where('event_id', id) // Query by the event ID
    .first() // Retrieves the first matching record
    .then(event => {
      if (!event) {
        return res.status(404).send('Event not found');
      }

      // Render the edit form and pass the event data
      res.render('adminEditEvent', { event });
    })
    .catch(error => {
      console.error('Error fetching Event for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Handle Edit Event Form Submission
app.post('/admin/editEvent/:id', (req, res) => {
  let id = req.params.id;

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

  // Prepare data for update
  const updatedEvent = {
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
    event_status: event_status || 'P'
  };

  // Update the database record
  knex('event_details')
    .where('event_id', id) // Find the event by ID
    .update(updatedEvent) // Update the event details
    .then(result => {
      if (result === 0) {
        // No rows updated (invalid ID)
        return res.status(404).send('Event not found');
      }
      res.redirect('/admin/manageEvents'); // Redirect to the manage events page after editing
    })
    .catch(error => {
      console.error('Error updating event:', error);
      res.status(500).send('Internal Server Error');
    });
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

// Handle GET request for reporting event results
app.get('/admin/reportEvent/:id', (req, res) => {
  const id = req.params.id;

  // Query the event_details table to get event details
  knex('event_details')
    .where('event_id', id)
    .select('total_attendance_estimate', 'planned_hour_duration', 'org_name', 'event_id')
    .first() // Fetch a single record from event_details
    .then(eventDetails => {
      if (!eventDetails) {
        return res.status(404).send('Event not found');
      }

      // Now, query the event_results table to get any matching results for the event
      knex('event_results')
        .where('event_id', id)
        .first() // Fetch a single record from event_results if it exists
        .then(eventResults => {
          // Combine both event details and event results into one object
          const event = {
            ...eventDetails,
            ...eventResults // If eventResults exists, it will override any fields from eventDetails
          };

          // Render the adminReportEvent.ejs page with the combined event data
          res.render('adminReportEvent', { event });
        })
        .catch(error => {
          console.error('Error fetching event results for reporting:', error);
          res.status(500).send('Internal Server Error');
        });
    })
    .catch(error => {
      console.error('Error fetching event details for reporting:', error);
      res.status(500).send('Internal Server Error');
    });
});



// Handle POST request to submit event results
app.post('/admin/reportEvent/:id', (req, res) => {
  const eventId = req.params.id;
  const {
    event_date,
    num_participants,
    event_duration_hours,
    pockets_produced,
    collars_produced,
    envelopes_produced,
    vests_produced,
    total_products_completed
  } = req.body;

  const newEventResult = {
    event_id: eventId,
    event_date: event_date || null,
    num_participants: parseInt(num_participants, 10) || 0,
    event_duration_hours: parseFloat(event_duration_hours) || 0,
    pockets_produced: parseInt(pockets_produced, 10) || 0,
    collars_produced: parseInt(collars_produced, 10) || 0,
    envelopes_produced: parseInt(envelopes_produced, 10) || 0,
    vests_produced: parseInt(vests_produced, 10) || 0,
    total_products_completed: parseInt(total_products_completed, 10) || 0,
  };

  // Upsert into event_results table (update if event_id exists, otherwise insert)
  knex('event_results')
    .insert(newEventResult)
    .onConflict('event_id') // Handle conflict on event_id
    .merge() // Update the existing record with the new values
    .then(() => {
      res.redirect('/admin/manageEvents'); // Redirect to the admin events page after submission
    })
    .catch(error => {
      console.error('Error upserting event results:', error);
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
    state,
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
    state: state || null,
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

// Displaying the Volunteer management page
app.get('/admin/manageVolunteers', (req, res) => {
  knex('contact')
    .join('volunteer', 'contact.contact_id', '=', 'volunteer.contact_id')
    .select(
      'contact.contact_id',
      'contact.first_name',
      'contact.last_name',
      'contact.email_address',
      'contact.phone_number',
      'contact.preferred_contact_method',
      'contact.gender',
      'volunteer.sewing_level',
      'volunteer.estimated_hours_per_month',
      'volunteer.date_joined'
    )
    .orderBy('contact.last_name', 'asc') // Sort by last name for better UX
    .then(volunteers => {
      res.render('manageVolunteers', { volunteers });
    })
    .catch(error => {
      console.error('Error fetching volunteers:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Display the Add Volunteer Form (admin)
app.get('/admin/addVolunteer', (req, res) => {
  knex('referral_types') // Fetch any necessary data (if needed)
  .select('*')
  .then(ref_types => {
  res.render('adminAddVolunteer', { ref_types });
  })
  .catch(error => {
      console.error('Error fetching referral types:', error);
      res.status(500).send('Internal Server Error');
  });
});

// Post for the Add Volunteer Form (admin)
app.post('/admin/addVolunteer', (req, res) => {
  const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone_number,
      email_address,
      street_address,
      city,
      state,
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
      state: state || null,
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
        res.redirect('/admin/manageVolunteers'); // Redirect to the home page on successful submission
      })
      .catch(error => {
        console.error('Error submitting volunteer form:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  // Delete Volunteer Route
  app.post('/admin/deleteVolunteer/:id', (req, res) => {
    const id = req.params.id;
  
    knex.transaction(trx => {
      // Delete from volunteers table first
      return trx('volunteer')
        .where('contact_id', id) // Ensure to use the correct field for the join
        .del()
        .then(() => {
          // Then delete from contact table
          return trx('contact')
            .where('contact_id', id)
            .del();
        });
    })
      .then(() => {
        res.redirect('/admin/manageVolunteers'); // Redirect back to admin page
      })
      .catch(error => {
        console.error('Error deleting volunteer:', error);
        res.status(500).send('Internal Server Error');
      });
  });


  // Getting the Edit Volunteer page
app.get('/admin/editVolunteer/:id', (req, res) => {
  const id = req.params.id;

  // Query to fetch data from both contact and volunteer tables
  knex('contact')
    .join('volunteer', 'contact.contact_id', '=', 'volunteer.contact_id') // Join the tables
    .select(
      'contact.contact_id',
      'contact.first_name',
      'contact.last_name',
      'contact.date_of_birth',
      'contact.gender',
      'contact.phone_number',
      'contact.email_address',
      'contact.street_address',
      'contact.city',
      'contact.state',
      'contact.zip',
      'contact.preferred_contact_method',
      'volunteer.referral_source_id',
      'volunteer.referral_other_text',
      'volunteer.sewing_level',
      'volunteer.estimated_hours_per_month',
      'volunteer.travel_mile_radius',
      'volunteer.willing_to_lead_flag',
      'volunteer.teach_sewing_flag',
      'volunteer.date_joined'
    )
    .where('contact.contact_id', id) // Filter by the contact ID
    .first() // Retrieve the first matching record
    .then(volunteer => {
      if (!volunteer) {
        return res.status(404).send('Volunteer not found');
      }

      // Render the edit form and pass the combined volunteer data
      res.render('adminEditVolunteer', { volunteer });
    })
    .catch(error => {
      console.error('Error fetching Volunteer for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Post for the Edit Volunteer Form (admin)
app.post('/admin/editVolunteer/:id', (req, res) => {
  const id = req.params.id; // This will be the contact_id from the URL
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    phone_number,
    email_address,
    street_address,
    city,
    state,
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
  const updatedContact = {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    date_of_birth: date_of_birth,
    gender: gender || 'N',
    phone_number: phone_number.trim(),
    email_address: email_address.trim(),
    street_address: street_address || null,
    city: city || null,
    state: state || null,
    zip: zip || null,
    preferred_contact_method: preferred_contact_method || 'E',
  };
  
  // Prepare Volunteer data
  const updatedVolunteer = {
    referral_source_id: parseInt(referral_source_id, 10) || null,
    referral_other_text: referral_other_text || null,
    sewing_level: sewing_level || 'B',
    estimated_hours_per_month: parseInt(estimated_hours_per_month, 10) || 0,
    travel_mile_radius: travel_mile_radius || null,
    willing_to_lead_flag: willing_to_lead_flag || false,
    teach_sewing_flag: teach_sewing_flag || false
  };

  // First, update the contact table
  knex('contact')
    .where('contact_id', id) // Find the contact by ID
    .update(updatedContact)
    .then(() => {
      // Then, update the volunteer table for the same contact
      return knex('volunteer')
        .where('contact_id', id) // Find the volunteer by contact_id
        .update(updatedVolunteer);
    })
    .then(() => {
      res.redirect('/admin/manageVolunteers'); // Redirect to the manage volunteers page on successful update
    })
    .catch(error => {
      console.error('Error updating volunteer:', error);
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


app.get('/admin/manageEvents', (req, res) => {
  knex('event_details') // Querying the event_details table
    .select(
      'event_details.event_id',
      'event_details.org_name',
      'event_details.total_attendance_estimate',
      'event_details.event_type',
      'event_details.planned_date',
      'event_details.start_time',
      'event_details.planned_hour_duration',
      'event_details.event_status'
    )
    .orderBy('event_details.planned_date', 'asc') // Sort by planned date in ascending order
    .then(events => {
      // Render the manageEvents.ejs template and pass the data
      res.render('manageEvents', { events });
    })
    .catch(error => {
      console.error('Error querying database:', error);
      res.status(500).send('Internal Server Error');
    }); // Error handling for Knex queries
});

// Route to Delete Event Request
app.post('/admin/deleteEvent/:id', (req, res) => {
  const id = req.params.id;
  knex('event_details')
    .where('event_id', id)
    .del()
    .then(() => {
      res.redirect('/admin/manageEvents'); // Redirect back to admin page
    })
    .catch(error => {
      console.error('Error deleting event:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.listen(port, () => console.log("Express App has started and server is listening!"));
