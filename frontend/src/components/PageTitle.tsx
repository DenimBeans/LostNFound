import '../Styles/FrontPage.css';
import {useRef, useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import Logo from '../assets/KnightFindlogo.png';

function PageTitle() {

  const location = useLocation().pathname;
  
  const HomeRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLInputElement>(null);
  const logoutRef = useRef<HTMLInputElement>(null);

  function headerVis()
  {
    if (HomeRef.current && notifRef.current && accountRef.current && aboutRef.current
        && logoutRef.current && location === '/main')
    {
      HomeRef.current.style.display = 'none';
      notifRef.current.style.visibility = 'visible';
      accountRef.current.style.visibility = 'visible';
      aboutRef.current.style.visibility = 'visible';
      logoutRef.current.style.visibility = 'visible';
    }
    else if(HomeRef.current && notifRef.current && accountRef.current && aboutRef.current
        && logoutRef.current && location === '/Notification')
    {
      HomeRef.current.style.visibility = 'visible';
      notifRef.current.style.display = 'none';
      accountRef.current.style.visibility = 'visible';
      aboutRef.current.style.visibility = 'visible';
      logoutRef.current.style.visibility = 'visible';
    }
    else if (HomeRef.current && notifRef.current && accountRef.current && aboutRef.current
        && logoutRef.current && location === '/AccountSettings')
    {
      HomeRef.current.style.visibility = 'visible';
      notifRef.current.style.visibility = 'visible';
      accountRef.current.style.display = 'none';
      aboutRef.current.style.visibility = 'visible';
      logoutRef.current.style.visibility = 'visible';
    }
    else if (HomeRef.current && notifRef.current && accountRef.current && aboutRef.current
        && logoutRef.current && location === '/About')
    {
      HomeRef.current.style.visibility = 'visible';
      notifRef.current.style.visibility = 'visible';
      accountRef.current.style.visibility = 'visible';
      aboutRef.current.style.display = 'none';
      logoutRef.current.style.visibility = 'visible';
    }
    
  }
  function Home()
  {
    window.location.href = '/main';
  }
  function Notif()
  {
    window.location.href = '/Notification';
  }
  function AccountSetting()
  {
    window.location.href = '/AccountSettings';
  }
  function About()
  {
    window.location.href = '/About';
  }
  function logout()
  {
    sessionStorage.removeItem('user_data');
    window.location.href = '/';
  }

  useEffect(() => 
  {
    headerVis();
  },[]);

  return (
    <div id = "TitleBorder">
      <img alt = "KnightFind logo" src = {Logo} id = "title"/>
      <input type = "button" id = "main" className = "headerBtn" value = "Home"
        ref = {HomeRef} onClick = {Home}/>
      <input type = "button" id = "notifs" className = "headerBtn" value = "Notifications"
        ref = {notifRef} onClick = {Notif}/>
      <input type = "button" id = "account" className = "headerBtn" value = "Account Settings"
        ref = {accountRef} onClick = {AccountSetting}/>
      <input type = "button" id = "about" className = "headerBtn" value = "About"
        ref = {aboutRef} onClick = {About}/>
      <input type = "button" id = "logout" className = "headerBtn" value = "Logout" 
        ref = {logoutRef} onClick = {logout}/>
    </div>
    
  );
};

export default PageTitle;
