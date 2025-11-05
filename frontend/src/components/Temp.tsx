import React, { useState } from 'react';
import { buildPath} from './Path';
import '../Styles/FrontPage.css';

// To be used as a temporary landing spot for finishing registration. - Jean

function Temp() {

    const logPath = buildPath("");

    return (
        <div id="loginDiv">
            <span id="inner-title">Account registered! Please check your email for account verification.</span><br />

            <p id = "tempLink"><a href = {logPath}>Return to Login</a></p>
        </div>
    );
};

export default Temp;
