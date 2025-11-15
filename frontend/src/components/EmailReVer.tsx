function EmailReVer(){
const { token } = useParams();
const [message, setMessage] = useState('');


useEffect(() => {Verify(token);},[token]);
  
async function Verify(token: any){

   try {
      
      const response = await fetch(buildAPIPath(`api/auth/verify/${token}`),
        { method: 'GET', headers: { 'Content-Type': 'application/json' } });

      var res = JSON.parse(await response.text());

      if (res.success == true) {
        setMessage(res.message);
        
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
      <h1>{message} Leave</h1>
    </div>
    
  );
};

export default EmailReVer