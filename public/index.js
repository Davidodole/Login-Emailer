// Declearing a Variables 
const emailLogin = document.getElementById("EmailLogin");
const userName = document.getElementById("Username");
const password = document.getElementById("password");
const button = document.getElementById("btn");
const confirmPassword = document.getElementById("ConfirmPassword");
const span = document.getElementById("txt");
let checkedBtn = document.getElementById("checked");

// adding eventlistener to the input form for validation 
emailLogin.addEventListener("submit", (e)=>{
    if(e.target[0,1].value.length === 0){
        e.preventDefault();
        if(e.target[0].value.length === 0){
            span.innerHTML = "please type in username or email";
        }
        if(e.target[1].value.length === 0){
            span.innerHTML = "please input your password";
        }else{
            if(e.target[1].value.length > 0){
                console.log("correct!");
            }
        }
    }else if(e.target[2].id === "ConfirmPassword"){
        if(e.target[2].value.length === 0){
            e.preventDefault()
            span.innerHTML = "please confirm your Password";
        }else{
            if(e.target[1].value === e.target[2].value){
                span.innerHTML = "All Good 👍";
            }
            else{
                e.preventDefault()
                span.innerHTML = "There was a password mismatch!";
            }
        }
    }else{
        
    }
});