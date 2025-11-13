import React, { useState } from 'react';
import { buildAPIPath } from './Path';
import '../Styles/FrontPage.css';

function ForgorPass() {
  const [message, setMessage] = useState('');
  const [EmailName, setEmailName] = React.useState('');
  

  function handleSetEmailName(e: any): void {
    setEmailName(e.target.value);
  }

  async function Forgor(event: any): Promise<void> {
    event.preventDefault();

    var obj = { email: EmailName};
    var js = JSON.stringify(obj);
    
    try {
      
      const response = await fetch(buildAPIPath('api/auth/forgot-password'),
        { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.error != '') {
        setMessage(res.error);
      }
      else {

        setMessage('Please check you email for the password reset link.');
      }
    }

    catch (error: any) {
      alert(error.toString());
      return;
    }
  };

  return (
    <div id="loginDiv">
      <span className ="inner-title">Forgot Password?</span><br />
       <input type="text" id="loginName" placeholder="Email"
        onChange={handleSetEmailName} />

      <input type="submit" id="loginButton" className="buttons" value="Submit"
        onClick={Forgor} />
      <span id="loginResult">{message}</span>
    </div>
  );
};

export default ForgorPass;
