import React, { useState } from 'react';
import { buildPath, buildAPIPath } from './Path';
import '../Styles/FrontPage.css';

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = React.useState('');
  const [loginPassword, setPassword] = React.useState('');
  const regPath = buildPath("Register");
  const resetPath = buildPath("PasswordResetEmail");

  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();

    var obj = { email: loginName, password: loginPassword };
    var js = JSON.stringify(obj);
    
    try {
      
      const response = await fetch(buildAPIPath('api/auth/login'),
        { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.error != '') {
        setMessage(res.error);
      }
      else {
        var user = { firstName: res.firstName, lastName: res.lastName, userId: res.userId, accessToken: res.accessToken}
        sessionStorage.setItem('user_data', JSON.stringify(user));

        setMessage('');
        window.location.href = '/main';
      }
    }

    catch (error: any) {
      alert(error.toString());
      
      return;
    }
  };

  return (
    <div id="loginDiv">

      <span className ="inner-title">Record thine login credentials...</span><br />
      <span id="loginResult"> {message} </span>

       <input type="text" id="loginName" placeholder="Email"
        onChange={handleSetLoginName} />
       <input type="password" id="loginPassword" placeholder="Password"
        onChange={handleSetPassword} />
        <p id="passReset"><a href = {resetPath}>Forgot Password?</a></p>

      <input type="submit" id="loginButton" className="buttons" value="Submit"
        onClick={doLogin} />
      <p id="regLink">New user?<a href = {regPath}> Create an Account!</a></p>
    </div>
  );
};

export default Login;
