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
const GoogleStrategy = require("passport-google-oauth2").Strategy
require("dotenv").config();
const currentDate = new Date()
const saltRound = 10;

// require express into app 
const app = express();

// setting the database enetering 
const db = new pg.Client({
    user: process.env.PG_USER,
    host : process.env.PG_HOST,
    database : process.env.PG_DATABASE,
    password : process.env.PG_PASSWORD,
    port : process.env.PG_PORT,
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
        "SELECT * FROM userdatabase WHERE username = $1",
        [email]
    );

    // condition statement 
    if(userCheck.rows.length > 0){
        res.send("User already exit");
    }else{
        // Hashing password and storing inside the database 
        bcrypt.hash(password, saltRound,(err, hash)=>{
            const result = db.query(
                "INSERT INTO userdatabase (username, password) VALUES($1, $2)",
                [email, hash],(err, results)=>{
                    if(err) throw err;
                    res.redirect("/login");
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
app.get("/auth/google",passport.authenticate("google",{
    scope: ["profile", "email"]
}))
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
});
app.get("/auth/google/secrets", passport.authenticate("google",{
    successRedirect: "/secret",
    failureRedirect: "/",
}))

passport.use(
    "local",
    new LocalStrategy(async(username, password, cb)=>{
    // using try and catch method for any error 

    try {
                 // checking if the user already exit 
    const userChecked =await db.query( 
         "SELECT * FROM userdatabase WHERE username = $1",
        [username]
        );
        
     // checking if user exit the we send them the secret page 
    if(userChecked.rows.length > 0){
        const userID = userChecked.rows[0];
        const passwordChecker = userID.password;
        bcrypt.compare(password, passwordChecker, (err, result)=>{
            if(err){
                return cb(err)
            }else{
                if(result){
                    return cb(null, result);
                    Login(userID.username);
                }else{
                    return cb("user does not exits");
                }
            }
        })
    }
    } catch (error) {
        return cb(error)
    }
}));

passport.use(
    "google",
    new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:4000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async(accessToken, refreshToken, profile, cb)=>{
    
        // checking if user already exist then send to the secret page direct 
    const userCheckedLogin = await db.query(
        "SELECT * FROM userdatabase WHERE username = $1",
        [profile.email]
    );
    if(userCheckedLogin.rows.length === 0){
        const userID = await db.query("INSERT INTO userdatabase (username, password) VALUES($1, $2)",[profile.email, profile.id]);
        cb(null, userID.rows[0]);
        signUp(profile.email)
    }else{
        cb(null, userCheckedLogin.rows[0]);
        Login(profile.email);
    }
    }
))

passport.serializeUser((user, cb)=>{
    return cb(null, user)
});
passport.deserializeUser((user, cb)=>{
    return cb(null, user)
});

// The port were the website listen to 
const PORT = process.env.PORT || 5500;

app.listen(PORT, ()=> console.log(`http://127.0.0.1:${PORT}`));


// anytime the user login to the website they will receive a notification message that a new logged in as been detected and also specify the time 

function Login(myEmail){
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
        to: myEmail,
        subject: "You've Just Login",
        html: `<h3>Detect New Login</h3>
        <p>If you didn't perform this login</p>
        <p>please report this to the web developer: ${process.env.API_GMAIL}</p>
        <p> ${currentDate.toDateString()}</P>
        <p> ${currentDate.getTime()}</p>
        `
        }
        transporter.sendMail(mailOptions, (err, info)=>{
            if(err) throw err;
        });
}



// when a user sign up to the website then this email will be sent to them as notification for signing up 
function signUp(myEmail){
    
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
                        to: myEmail,
                        subject: "Sending email from Nodejs Server",
                        html: `<h3> Thank you for signing up</h3>
                        <p>please confirm your email if probably is not correct ${myEmail} </p>
                        <p>This is the time you sign up : ${currentDate.toDateString()}</P>
                        <p> ${currentDate.getTime()}</p>
                        `
                        }
                        transporter.sendMail(mailOptions, (err, info)=>{
                            if(err) throw err;
                        });
}














// http://127.0.0.1:4000/auth/google/secrets