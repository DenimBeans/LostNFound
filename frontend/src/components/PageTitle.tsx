import '../Styles/FrontPage.css';
import {useRef, useEffect} from 'react';
import {useLocation} from 'react-router-dom';

function PageTitle() {

  const location = useLocation().pathname;
  const logoutRef = useRef<HTMLInputElement>(null);

  function logoutVis()
  {
    if (logoutRef.current && location === '/main')
      logoutRef.current.style.visibility = 'visible';
  }

  function logout()
  {
    sessionStorage.removeItem('user_data');
    window.location.href = '/';
  }

  useEffect(() => 
  {
    logoutVis();
  },[]);

  return (
    <div id = "TitleBorder">
      <h1 id="title">KnightFind</h1>
      <input type = "button" id = "logout" value = "Logout" ref = {logoutRef}
      onClick = {logout}/>
    </div>
    
  );
};

export default PageTitle;
