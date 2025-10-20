function LoggedInName()
{

    function doLogout(event:any) : void
    {
      event.preventDefault();
    
      localStorage.removeItem("user_data")
      window.location.href = '/';
  };    

    return(
      <div id="loggedInDiv">
        <span id="userName">This is a temporary landing page. </span><br />
        <button type="button" id="logoutButton" className="buttons" 
           onClick={doLogout}> Log Out </button>
      </div>
    );
};


export default LoggedInName;
