import { useState } from 'react';
import { buildPath } from './Path';
import {useParams} from 'react-router-dom';
import {useEffect} from 'react';
import '../Styles/FrontPage.css';



function EmailVer() {
const { token } = useParams();
const [message, setMessage] = useState('');


useEffect(() => {Verify(token);},[token]);
  
async function Verify(token: any){

   try {
      
      const response = await fetch(buildPath(`api/auth/verify/${token}`),
        { method: 'GET', headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.success == true) {
        setMessage(res.message);
        setTimeout(() =>{window.location.href = '/';},3000);//the 3000 is miliseconds so 3 seconds.
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
    </div>
    
  );
};

export default EmailVer;
