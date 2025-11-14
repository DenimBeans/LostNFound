import React, { useState} from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';
import '../Styles/Notification.css';

function Notification(){

    interface NotifData{
        _id : string;
        title : string;
        text : string;
        isMeetup : boolean;
        category : string;
        imageUrl : string;
    }

     const ViewNotIf = useRef<HTMLDivElement>(null);


    const [NotifContainer,setNotifContainer] = useState<NotifData[]>([]);

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    //const [viewNotifId, setviewNotifId] = React.useState('');
    //View notification
    const [NotifTitle, setNotifTitle] = React.useState('');
    const [NotifDescription, setNotifDescription] = React.useState('');
    const [NotifCategory, setNotifCategory] = React.useState('');
    const [NotifImageUrl, setNotifImageUrl] = React.useState('');

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
    };

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


    async function Read(NotId: any){

         try {
            const response = await fetch(buildAPIPath(`api/notifications/${NotId}/read`),
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
    };


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

    async function View(Notif : any){

        if (ViewNotIf.current){
            ViewNotIf.current.style.visibility = 'visible';
        }
        setviewNotifId(Notif.notificationId)
        setNotifTitle(Notif.title);
        setNotifDescription(Notif.text);
        setNotifCategory(Notif.category);
        setNotifImageUrl(Notif.imageUrl);

    };

    async function ReturnNotif(id: any,answer : string){
        if (answer == "Accept"){
            try {
            const response = await fetch(buildAPIPath(`api/users/${id}/notifications?isRead=true&isMeetup=true`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            console.log(res)
            
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
        }
        else if (answer == "Deny"){
            try {
            const response = await fetch(buildAPIPath(`api/users/${id}/notifications?isRead=true&isMeetup=false`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            console.log(res)
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
        }
        

    };

    return(
        <div id = "NotificationMain">
            <p>{itemUSERID}</p>
            <div id = "NotifPage">
                {NotifContainer.map(NotifContainer => (
                    <div key = {NotifContainer._id} className = "NotifContainers">
                        <input type = "text" id = "NotificationTitle" className = "NotTitle" value = {NotifContainer.text} readOnly/>
                        <input type = "text" id = "NotificationMeetup" className = "NotTitle" value = {NotifContainer.isMeetup} readOnly/>
                        <button type = "button" id = "NotificationData" onClick = {() => View(NotifContainer)}>View Report</button>
                        <button type = "button" id = "NotificationData" onClick = {() => Read(NotifContainer._id)}>Read</button>
                        <button type = "button" id = "NotificationData" onClick = {() => Delete(NotifContainer._id)}>Delete</button>
                    </div>
                ))}
            
            </div>
            <div id = "ViewNotIf" ref = {ViewNotIf}>

                <input type = "text" id = "NotifTitle" className = "NotifData" value = {NotifTitle} readOnly/>
                <input type = "text" id = "NotifDesc" className = "NotifData" value = {NotifDescription} readOnly/>
                <input type = "text" id = "NotifCat" className = "NotifData" value = {NotifCategory} readOnly/>
                <input type = "text" id = "NotifImage" className = "NotifData" value = {NotifImageUrl} readOnly/>
                <button type = "button" id = "NotifAccept" className = "NotifButton" onClick = {() => ReturnNotif(itemUSERID,"Accept")}>Accept</button>
                <button type = "button" id = "NotifContest" className = "NotifContest">Contest</button>
                <button type = "button" id = "NotifDeny" className = "NotifDeny" onClick = {() => ReturnNotif(itemUSERID,"Deny")}>Deny</button>

            </div>
            <div id = "buttonholder">
                <button type = "button" className = "bottombutton" onClick = {ReadAll}>Read-ALL</button>
                <button type = "button" className = "bottombutton" onClick = {DeleteAll}>Delete-ALL</button>
            </div>
        </div>
    );
};


export default Notification;