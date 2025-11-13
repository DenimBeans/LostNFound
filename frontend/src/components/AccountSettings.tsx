//Uncomment as needed. - Jean

import React/*, { useState}*/ from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

function AccountSettings(){

    const [itemUSERID, setItemUSERIDValue] = React.useState('');
    const [userFirst, setUserFirst] = React.useState('');
    const [userLast, setUserLast] = React.useState('');
    const [userEmail, setUserEmail] = React.useState('');
    const [userVerified, setUserVerified] = React.useState('');
    const [userCreated, setUserCreated] = React.useState('');
    const [userUpdated, setUserUpdated] = React.useState('');

    async function ShowUserInfo(Id): Promise<void>{
        

        try {
            const response = await fetch(buildAPIPath(`api/users/${Id}`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            setUserFirst(res.firstname);
            setUserLast(res.lastName);
            setUserEmail(res.email);
            setUserVerified(res.isVerified);
            setUserCreated(res.createdAt);
            setUserUpdated(res.updatedAt);
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
            ShowUserInfo(itemUSERID);
        }
        else{
            window.location.href = '/';
        }
    },[]);

    //Temporarily displaying itemUSERID so that compiler runs. 
    // Feel free to change once variable is used elsewhere. - Jean
    return(
        <div id = "AccountSettingsMain">
            <input type = "text" id = "id" className = "AccountSet" value = {itemUSERID} readOnly/>
            <input type = "text" id = "firstname" className = "AccountSet" value = {userFirst} readOnly/>
            <input type = "text" id = "lastname" className = "AccountSet" value = {userLast} readOnly/>
            <input type = "text" id = "email" className = "AccountSet" value = {userEmail} readOnly/>
            <input type = "text" id = "isVer" className = "AccountSet" value = {userVerified} readOnly/>
            <input type = "text" id = "created" className = "AccountSet" value = {userCreated} readOnly/>
            <input type = "text" id = "updated" className = "AccountSet" value = {userUpdated} readOnly/>


        </div>
    );
};


export default AccountSettings;