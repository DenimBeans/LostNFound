import React, { useState } from 'react';
import { buildPath } from './Path';
import {useParams} from 'react-router-dom';




function EmailVer() {
const { token } = useParams();
const [message, setMessage] = useState('');
  
async function Verify(token){

   try {
      
      const response = await fetch(buildPath(`api/auth/verify/${token}`),
        { method: 'POST', headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.success == true) {
        setMessage(res.message);
        setTimeout(() =>{window.location.href = '/login';},3000);//the 3000 is miliseconds so 3 seconds.
      }
      if(res.error == "Invalid or expired verification token"){
        setMessage(res.error);
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

  
  
  
 return (
    <div id = "EmailMain">
      <h1>{message}</h1>
      <input type="submit" id="loginButton" className="buttons" value="Verify Email"
        onClick={Verify} />
    </div>
    
  );
};

export default EmailVer;
