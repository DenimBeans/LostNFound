import '../Styles/About.css';


function About(){

    const Github = "https://github.com/DenimBeans/LostNFound";



    return(
        <div id = "AboutMain">
            <span id ="AboutTitle">Contibutors</span>
            <span className = "Assigned">Project Manager and Full Stack</span>
            <input type = "text" id = "jean" className = "About" 
            value =  "Jean Deguzman" readOnly/>
            <span className = "Assigned">Database</span>
            <input type = "text" id = "Rian Lowery" className = "About" 
            value = " Rian Lowery " readOnly/>
            <span className = "Assigned">API</span>
            <input type = "text" id = "Armando Rosarion Nazario" className = "About" 
            value = "Armando Rosarion Nazario " readOnly/>
            <input type = "text" id = "Bryant Arteaga" className = "About" 
            value = "Bryant Arteaga " readOnly/>
            <span className = "Assigned">Frontend</span>
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