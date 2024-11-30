// INTEX Group 2-2

let express = require("express"); // Importing the express class/library

let app = express(); // Creating an express object

let path = require("path"); // Importing the path class/library

const port = 5000; // This port can change

app.set("view engine", "ejs"); // Telling the server that our web files will be EJS files

app.set("views", path.join(__dirname, "views")); // Telling the server where to find the views (web pages)

app.use(express.urlencoded({extended: true})); // Allows the server to work with the requests that are submitted

// const knex = require("knex") ({ // Connecting to our Postgres Database
//     client : "pg",
//     connection : {
//         host : "localhost",
//         user : "postgres",
//         password : "admin", // This would need to change
//         database : "mycompany",
//         port : 5432
//     }
// });

app.get("/", (req, res) => {
    res.render('index', {}) // res.send is for .html files, res.render is for .ejs files
});

app.listen(port, () => console.log("Express App has started and server is listening!"));
