// Require all module and packages
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const pg = require("pg");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const bcrypt = require("bcrypt");
const nodEmailer = require("nodemailer");
require("dotenv").config();
const currentDate = new Date()
const saltRound = 10;

// require express into app 
const app = express();

// setting the database enetering 
const db = new pg.Client({
    user: "postgres",
    host : "localhost",
    database : "Users",
    password : process.env.PASSWORD,
    port : 5432,
});


// connection to the database
db.connect().then(()=> console.log("connected"));


// website middleware
app.set("view engine", 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(session({
    secret : process.env.MY_SECTRET,
    resave: false,
    saveUninitialized : false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Handling the post request 

app.post("/register", async (req, res)=>{

    // Getting user value 
    const email = req.body.username;
    const password  = req.body.password;

        // checking if the user already exit 
        const userCheck = await db.query(
        "SELECT * FROM usersdata WHERE username = $1",
        [email]
    );

    // condition statement 
    if(userCheck.rows.length > 0){
        res.send("User already exit");
    }else{
        // Hashing password and storing inside the database 
        bcrypt.hash(password, saltRound,(err, hash)=>{
            const result = db.query(
                "INSERT INTO usersdata (username, password) VALUES($1, $2)",
                [email, hash],(err, results)=>{
                    if(err) throw err;
                    res.redirect("/login");
                    
                    // setting a email transporter 
                    const transporter = nodEmailer.createTransport({
                    service: "gmail",
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.API_GMAIL,
                        pass: process.env.API_PASSWORD,
                    }
                    });
                    const mailOptions = {
                    from: {
                        name: "TechGenius",
                        address: process.env.API_GMAIL,
                    },
                    to: email,
                    subject: "Sending email from Nodejs Server",
                    html: `<h3> Thank you for signing up</h3>
                    <p>please confirm your email if probably is not correct ${email} </p>
                    <p>This is the time you sign up : ${currentDate.toDateString()}</P>
                    `
                    }
                    transporter.sendMail(mailOptions, (err, info)=>{
                        if(err) throw err;
                    });
                }
            );        
        });
    }
});
app.post("/login",passport.authenticate("local",{
    successRedirect: "/secret",
    failureRedirect: "/register"
}));

//Handling the root route of the website 




app.get("/", (req, res)=>{
    res.render("index");
});
app.get('/register',(req, res)=>{
    res.render("register")
})
app.get("/login", (req, res)=>{
    res.render("login")
});
app.get("/secret",(req, res)=>{
    if(req.isAuthenticated()){
        res.render("secret")
    }
    else{
        res.redirect('/login')
    }
})

passport.use( new LocalStrategy(async(username, password, cb)=>{

         // checking if the user already exit 
    const userChecked =await db.query( 
         "SELECT * FROM usersdata WHERE username = $1",
        [username]
        );
     // checking if user exit the we send them the secret page 
    if(userChecked.rows.length > 0){
        const passwordChecker = userChecked.rows[0].password;
        bcrypt.compare(password, passwordChecker, (err, result)=>{
            if(result){
                 // setting a email transporter 
                const transporter = nodEmailer.createTransport({
                    service: "gmail",
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.API_GMAIL,
                        pass: process.env.API_PASSWORD,
                    }
                    });
                    const mailOptions = {
                    from: {
                        name: "TechGenius",
                        address: process.env.API_GMAIL,
                    },
                    to: username,
                    subject: "You've Just Login",
                    html: `<h3>Detect New Login</h3>
                    <p>If you didn't perform this login</p>
                    <p>please report this to the web developer: ${process.env.API_GMAIL}</p>
                    <p> ${currentDate.toDateString()}</P>
                    `
                    }
                    transporter.sendMail(mailOptions, (err, info)=>{
                        if(err) throw err;
                    });
            }else{
                return cb("User does not Exist!")
            }
        })
    }
}));

passport.serializeUser((user, cb)=>{
    return cb(null, user)
});
passport.deserializeUser((user, cb)=>{
    return cb(null, user)
});

// The port were the website listen to 
const PORT = process.env.PORT || 5500;

app.listen(PORT, ()=> console.log(`http://127.0.0.1:${PORT}`));