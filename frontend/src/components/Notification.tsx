//Uncomment as needed. - Jean

import React, { useState} from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

function Notification(){

    interface NotifData{
        _id : string;
        title : string;
        
    }


    const [NotifContainer,setNotifContainer] = useState<NotifData[]>([]);

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    async function AllNotif(id: any){
        try {
            const response = await fetch(buildAPIPath(`api/users/${id}/notifications`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setNotifContainer(res.results);
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
    }

    useEffect(() => {
        const Data = sessionStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            AllNotif(UserData?.userId);
        }
        else{
            window.location.href = '/';
        }
    },[]);



//Paragraph tag with userID added to appease compiler.
//Remove once itemUSERID is used elsewhere - Jean
    return(
        <div id = "NotificationMain">
            <p value = {itemUSERID}></p>
            <div id = "LostItemPage">
                {NotifContainer.map(NotifContainer => (
                    <div key = {NotifContainer.itemId} className = "NotifContainers">
                        <input type = "text" id = "NotificationTitle" className = "NotTitle"  readOnly/>
                        <button type = "button" id = "NotificationData" >View Report</button>
                        <button type = "button" id = "NotificationDelete" >Delete</button>
                    </div>
                ))}
                
            </div>
            <div id = "buttonholder">
                <button type = "button" id = "deleteAllNotif">Delete</button>
            </div>
        </div>
    );
};


export default Notification;