//Uncomment as needed. - Jean

import React/*, { useState}*/ from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

import '../Styles/AccountSettings.css';


function AccountSettings(){

    const [itemUSERID, setItemUSERIDValue] = React.useState('');
    const [userFirst, setUserFirst] = React.useState('');
    const [userLast, setUserLast] = React.useState('');
    const [userEmail, setUserEmail] = React.useState('');
    const [userVerified, setUserVerified] = React.useState('');
    const [userCreated, setUserCreated] = React.useState('');
    const [userUpdated, setUserUpdated] = React.useState('');

    async function ShowUserInfo(id: any){
        
        

        try {
            const response = await fetch(buildAPIPath(`api/users/${id}`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            
            let txt = await response.text();
            let res = JSON.parse(txt);
            console.log(res);
            console.log(res.user);
            console.log(res.user.lastName);

            setUserFirst(res.user.firstName);
            setUserLast(res.user.lastName);
            setUserEmail(res.user.email);
            setUserVerified(res.user.isVerified);
            setUserCreated(res.user.createdAt);
            setUserUpdated(res.user.updatedAt);

            
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
            ShowUserInfo(UserData?.userId);
        }
        else{
            window.location.href = '/';
        }
    },[]);

    
    return(
        <div id = "AccountSettingsMain">
            <input type = "text" id = "id" className = "AccountSet" value = {itemUSERID}  readOnly/>
            <input type = "text" id = "firstname" className = "AccountSet" value = {userFirst} readOnly/>
            <input type = "text" id = "lastname" className = "AccountSet" value = {userLast}  readOnly/>
            <input type = "text" id = "Accountemail" className = "AccountSet" value = {userEmail} readOnly/>
            <input type = "text" id = "isVer" className = "AccountSet" value = {userVerified}  readOnly/>
            <input type = "text" id = "created" className = "AccountSet" value = {userCreated}  readOnly/>
            <input type = "text" id = "updated" className = "AccountSet" value = {userUpdated}  readOnly/>


        </div>
    );
};


export default AccountSettings;