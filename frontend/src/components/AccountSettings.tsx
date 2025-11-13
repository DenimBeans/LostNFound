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

    async function ShowUserInfo(id: any){


    function handleFirst(e: any): void {
        setUserFirst(e.target.value);
    }
        
    function handleLast(e: any): void {
        setUserLast(e.target.value);
    }
        
    function handleEmail(e: any): void {
        setUserEmail(e.target.value);
    }
        
    function handleVerified(e: any): void {
        setUserVerified(e.target.value);
    }
        
    function handleCreated(e: any): void {
        setUserCreated(e.target.value);
    }
        
    function handleUpdated(e: any): void {
        setUserUpdated(e.target.value);
    }
        
        

        try {
            const response = await fetch(buildAPIPath(`api/users/${id}`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            var res = JSON.parse(await response.text());

            if(res.error != ' '){
                console.log(res.error)
            }
            else{
            handleFirst(res.firstname);
            handleLast(res.lastName);
            handleEmail(res.email);
            handleVerified(res.isVerified);
            handleCreated(res.createdAt);
            handleUpdated(res.updatedAt);
            }

            
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

    //Temporarily displaying itemUSERID so that compiler runs. 
    // Feel free to change once variable is used elsewhere. - Jean
    return(
        <div id = "AccountSettingsMain">
            <input type = "text" id = "id" className = "AccountSet" value = {itemUSERID}  readOnly/>
            <input type = "text" id = "firstname" className = "AccountSet" value = {userFirst} onChange = {handleFirst} readOnly/>
            <input type = "text" id = "lastname" className = "AccountSet" value = {userLast} onChange = {handleLast} readOnly/>
            <input type = "text" id = "Accountemail" className = "AccountSet" value = {userEmail} onChange = {handleEmail} readOnly/>
            <input type = "text" id = "isVer" className = "AccountSet" value = {userVerified} onChange = {handleVerified} readOnly/>
            <input type = "text" id = "created" className = "AccountSet" value = {userCreated} onChange = {handleCreated} readOnly/>
            <input type = "text" id = "updated" className = "AccountSet" value = {userUpdated} onChange = {handleUpdated} readOnly/>


        </div>
    );
};


export default AccountSettings;