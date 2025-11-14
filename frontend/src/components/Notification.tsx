//Uncomment as needed. - Jean

import React, { useState} from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

function Notification(){

    interface NotifData{
        notificationId : string;
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


    async function Read(Notif: any){

         try {
            const response = await fetch(buildAPIPath(`api/notifications/${Notif.notificationId}/read`),
                { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                console.log(res.error)
            }
            else {
                
            }
        }
        catch (error: any) {
            console.log(error.toString());
        }
    };

    async function Delete(NotId: any){
         try {
            const response = await fetch(buildAPIPath(`api/notifications/${NotId}`),
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            
            let txt = await response.text();
            let res = JSON.parse(txt);

            if(res.error != ''){
                console.log(res.error)
            }
            else{
                setNotifContainer(NotifContainer.filter((NotifContainer) => NotifContainer.notificationId != NotId))
            }

            
        }
        catch (error: any) {
            console.log(error.toString());
        }
    }

    async function ReadAll(){
        try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}/notifications/read-all`),
                { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                console.log(res.error)
            }
            else {
                
            }
        }
        catch (error: any) {
            console.log(error.toString());
        }
    };

    async function DeleteAll(){
        try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}/notifications`),
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            
            let txt = await response.text();
            let res = JSON.parse(txt);

            if(res.error != ''){
                console.log(res.error)
            }
            else{
                setNotifContainer([])
            }

            
        }
        catch (error: any) {
            console.log(error.toString());
        }
    };

    return(
        <div id = "NotificationMain">
            <p>{itemUSERID}</p>
            <div id = "LostItemPage">
                {NotifContainer.map(NotifContainer => (
                    <div key = {NotifContainer.notificationId} className = "NotifContainers">
                        <input type = "text" id = "NotificationTitle" className = "NotTitle"  readOnly/>
                        <input type = "text" id = "NotificationMeetup" className = "NotTitle"  readOnly/>
                        <button type = "button" id = "NotificationData" >View Report</button>
                        <button type = "button" id = "NotificationData" onClick = {() => Read(NotifContainer)}>Read</button>
                        <button type = "button" id = "NotificationData" onClick = {() => Delete(NotifContainer.notificationId)}>Delete</button>
                    </div>
                ))}
                
            </div>
            <div id = "buttonholder">
                <button type = "button" className = "bottombutton" onClick = {ReadAll}>Read-ALL</button>
                <button type = "button" className = "bottombutton" onClick = {DeleteAll}>Delete-ALL</button>
            </div>
        </div>
    );
};


export default Notification;