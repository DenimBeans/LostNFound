//Uncomment as needed. - Jean

import React/*, { useState}*/ from 'react';
//import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

function Notification(){

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    useEffect(() => {
        const Data = sessionStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            //searchItem(true);
        }
        else{
            window.location.href = '/';
        }
    },[]);



//Paragraph tag with userID added to appease compiler.
//Remove once itemUSERID is used elsewhere - Jean
    return(
        <div id = "NotificationMain">
            
            <p>{itemUSERID}</p>
            
            <div id = "buttonholder">
                <button type = "button" id = "deleteAllNotif">Delete</button>
            </div>
        </div>
    );
};


export default Notification;