import React, { useState } from 'react';
import { buildPath, buildAPIPath } from './Path';
import '../Styles/Register.css';
import Modal from "react-modal";

function Register(){
const [message, setMessage] = useState('');
const [FirstName,setFirstName] = React.useState('');
const [LastName,setLastName] = React.useState('');
//const [RegisterUser,setRegisterUser] = React.useState('');
const [RegisterEmail,setRegisterEmail] = React.useState('');
const [RegisterPassword,setRegisterPassword] = React.useState('');
//const [RegisterPasswordRepeat,SetRegisterPasswordRepeat] = React.useState('');
const [modalIsOpen, setIsOpen] = React.useState(false);
const [isValid, setIsValid] = useState(false);

const loginPath = buildPath("");

const emailRegEx = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/gm;

function handleSetFirstName(e: any): void{
    setFirstName(e.target.value);
}

function handleSetLastName(e: any): void{
    setLastName(e.target.value);
}

//function handleSetRegisterUser(e: any): void{
//    setRegisterUser(e.target.value);
//}

function handleSetRegisterEmail(e: any): void{
  const newEmail = e.target.value;
  setRegisterEmail(newEmail);
  setIsValid(emailRegEx.test(newEmail));
}

function handleSetRegisterPassword(e:any): void{
    setRegisterPassword(e.target.value);
}

//function handleSetRegisterPasswordRepeat(e: any): void{
//    SetRegisterPasswordRepeat(e.target.value);
//}

async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    var obj = {firstName: FirstName, lastName: LastName, email: RegisterEmail, password: RegisterPassword};
    var js = JSON.stringify(obj);
    
    
     try {
        
      const response = await fetch(buildAPIPath('api/auth/register'),
        { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.error == '') {
        setMessage("Account Registered! Please check your email for verification.");
        setIsOpen(true);
      }

      else if(!isValid)
      {
        setMessage("Invalid Email");
      }

      else {
        setMessage(res.error);
      }
    }

    catch (error: any) {
      alert(error.toString());
      return;
    }
  };

//<input type = "password" id = "PasswordRepeat" placeholder = "Re-enter Password" onChange = {handleSetRegisterPasswordRepeat} />
//<input type = "text" id = "UserName" placeholder = "Username" onChange = {handleSetRegisterUser} />

    return(
      <div id = "registerDiv">
        <span id = "RegisterTitle">Submit thine registration...</span><br/>
        <span id="RegisterResult">{message}</span>
        <input type = "text" id = "FirstName" placeholder = "First Name" onChange={handleSetFirstName} />
        <input type = "text" id = "LastName" placeholder = "Last Name" onChange ={handleSetLastName} />
 
        <input type = "text" id = "Email" placeholder = "Email" onChange = {handleSetRegisterEmail} />
        <input type = "password" id = "Password" placeholder = "Password" onChange = {handleSetRegisterPassword} />
        
        <input type = "Submit" id = "RegisterButton" className = "buttons" value = "Register" onClick = {doRegister} />
        <p id="regLink">Returning User?<a href = {loginPath}> Login!</a></p>

        <Modal
          isOpen={modalIsOpen}
          className = "successModal"
        >
          <h2 id = "successText">Account created! Please check your email for verification.</h2>
          <p id="modalLink"><a href = {loginPath}> Return to Login</a></p>
        </Modal>
      </div>  
    )
}

export default Register;