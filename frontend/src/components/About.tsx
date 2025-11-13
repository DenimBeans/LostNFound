import '../Styles/About.css';


function About(){

    const Github = "https://github.com/DenimBeans/LostNFound";



    return(
        <div id = "AboutMain">
            <input type = "text" id = "jean" className = "About" 
            value = "Project Manager and Full Stack : Jean Deguzman " readOnly/>
            <input type = "text" id = "Rian Lowery" className = "About" 
            value = "Database : Rian Lowery " readOnly/>
            <input type = "text" id = "Armando Rosarion Nazario" className = "About" 
            value = "API: Armando Rosarion Nazario " readOnly/>
            <input type = "text" id = "Bryant Arteaga" className = "About" 
            value = "API: Bryant Arteaga " readOnly/>
            <input type = "text" id = "Hiroki Yoshida" className = "About" 
            value = "Frontend Web: Hiroki Yoshida " readOnly/>
            <input type = "text" id = "Destiny Rodriguez" className = "About" 
            value = "Frontend Mobile: Destiny Rodriguez " readOnly/>
            <input type = "text" id = "Lucas Marrou" className = "About" 
            value = "Frontend General-Debugging : Lucas Marrou " readOnly/>
            
            <p id="Git"><a href = {Github}>Visit our Github!</a></p>

        </div>
    );
};


export default About;