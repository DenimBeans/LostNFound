import React, { useState } from 'react';
import { buildAPIPath } from './Path';
import {useParams} from 'react-router-dom';
import '../Styles/FrontPage.css';


function passreset() {
  const [message, setMessage] = useState('');
  const [PassName, setPassName] = React.useState('');
  const { token } = useParams();

  function handleSetPassName(e: any): void {
    setPassName(e.target.value);
  }

  async function resetpass(event: any): Promise<void> {
    event.preventDefault();

    var obj = { newPassword: PassName};
    var js = JSON.stringify(obj);
    
    try {
      
      const response = await fetch(buildAPIPath(`api/auth/reset-password/${token}`),
        { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.error != '') {
        setMessage(res.error);
      }
      else {

        setMessage('New password set!');
      }
    }

    catch (error: any) {
      alert(error.toString());
      return;
    }
  };

  return (
    <div id="loginDiv">
      <span id="inner-title">Insert new password.</span><br />
       <input type="password" id="loginName" placeholder="New Password"
        onChange={handleSetPassName} />

      <input type="submit" id="loginButton" className="buttons" value="Submit"
        onClick={resetpass} />
      <span id="loginResult">{message}</span>
    </div>
  );
};

export default passreset;
