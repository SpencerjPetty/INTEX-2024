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
        password : process.env.RDS_PASSWORD || "Roman$EatLargeT0gas", // This would need to change
        database : process.env.RDS_DB_NAME || "intex",
        port : process.env.RDS_PORT || 5432
    }
});

app.get("/", (req, res) => {
    knex('coding') // SQL query for collecting the data
      .select(
        'coding.id',
        'coding.language_name',
        'coding.created_year',
        'coding.creator',
        'coding.popularity_rank'
      )
      .first()
      .then(codes => {
        // Render the index.ejs template and pass the data
        res.render('index', { codes });
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      }); // res.send is for .html files, res.render is for .ejs files
});

app.listen(port, () => console.log("Express App has started and server is listening!"));
