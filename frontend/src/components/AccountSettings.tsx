//Uncomment as needed. - Jean

import React/*, { useState}*/ from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';

import '../Styles/AccountSettings.css';


function AccountSettings(){
    const EditUser = useRef<HTMLDivElement>(null);
    const DeleteUser = useRef<HTMLDivElement>(null);

    //get user info
    const [itemUSERID, setItemUSERIDValue] = React.useState('');
    const [userFirst, setUserFirst] = React.useState('');
    const [userLast, setUserLast] = React.useState('');
    const [userEmail, setUserEmail] = React.useState('');
    //const [userVerified, setUserVerified] = React.useState('');
    //const [userCreated, setUserCreated] = React.useState('');
    //const [userUpdated, setUserUpdated] = React.useState('');

    //deleteinfo
    //const [deletePass, setdeletepass] = React.useState('');

    //Change user info
    const [oldFirst, setoldFirst] = React.useState('');
    const [oldLast, setoldLast] = React.useState('');
    const [oldEmail, setoldEmail] = React.useState('');
    const[oldPass, setoldPass] = React.useState('');
    const[newPass, setnewPass] = React.useState('');
    //Handles

    /*function handleDeletePass(e: any): void{
        setdeletepass(e.target.value);
    }*/

    function handleOldFirst(e: any): void{
        setoldFirst(e.target.value);
    }

    function handleOldLast(e: any): void{
        setoldLast(e.target.value);
    }

    function handleOldEmail(e: any): void{
        setoldEmail(e.target.value);
    }

    function handleOldPass(e: any): void{
        setoldPass(e.target.value);
    }

    function handleNewPass(e: any): void{
        setnewPass(e.target.value);
    }

    async function exit(){
        if(EditUser.current){
            EditUser.current.style.visibility = 'hidden';
        }
        
    }

    async function exitDel(){
        if(DeleteUser.current){
            DeleteUser.current.style.visibility = 'hidden';
        } 
    }

        
    function showEdit(){
        if(EditUser.current){
            EditUser.current.style.visibility = 'visible';
        }
    }

    function showDelete(){
        if(DeleteUser.current){
            DeleteUser.current.style.visibility = 'visible';
        }
    }

    async function EditUserInfo(){
         let obj = { 
            firstName: oldFirst, 
            lastName: oldLast, 
            email: oldEmail,
            currentPassword: oldPass,
            newPassword: newPass};
        let js = JSON.stringify(obj);

         try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}`),
                { method: 'PATCH', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                console.log(res.error)
            }
            else {
                if (EditUser.current){
                    EditUser.current.style.display = 'none';
                }

                
            }
        }
        catch (error: any) {
            console.log(error)
        }
    };

    async function DeleteUserInfo(){

        try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}`),
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            
            let txt = await response.text();
            let res = JSON.parse(txt);

            if(res.error != ''){
                console.log(res.error)
            }
            else{
                window.location.href = '/';
            }

            
        }
        catch (error: any) {
            console.log(error)
        }
    };

    async function ShowUserInfo(id: any){
        
        

        try {
            const response = await fetch(buildAPIPath(`api/users/${id}`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            
            let txt = await response.text();
            let res = JSON.parse(txt);
            
            setUserFirst(res.user.firstName);
            setUserLast(res.user.lastName);
            setUserEmail(res.user.email);
            /*setUserVerified(res.user.isVerified);
            setUserCreated(res.user.createdAt);
            setUserUpdated(res.user.updatedAt);*/

            
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

    //<input type = "password" id = "deletepass" className = "AccountSet" placeholder = "Confirm Password" onChange = {handleDeletePass}/>
    
    return(
        <div id = "AccountSettingsMain">
          <span id = "MainTitle">Thine knights heraldry!</span>
            <div id = "EditUser" ref = {EditUser}>
                <button type = "button" id="exit" onClick={() => exit()}>X</button>
                <span id = "edittitle">Edit thine heraldry!</span>
                <input type = "text" id = "editfirst" className = "edituser" placeholder = {userFirst} onChange = {handleOldFirst}/>
                <input type = "text" className = "edituser" placeholder = {userLast} onChange = {handleOldLast}/>
                <input type = "text" className = "edituser" placeholder = {userEmail} onChange = {handleOldEmail}/>
                <input type = "text" className = "edituser" placeholder = "Old password"  onChange = {handleOldPass}/>
                <input type = "text" className = "edituser" placeholder = "New Password" onChange = {handleNewPass}/>
                <button type = "button" id = "edituserbtn"  onClick = {EditUserInfo}>Submit new info</button>
            </div>
            <div id = "DeleteUser" ref = {DeleteUser}>
                <button type = "button" id="exit" onClick={() => exitDel()}>X</button>
                <span id = "Warning">Are you absolutly sure you want to delete your account?</span>
                
                <button type = "button" id = "deleteuserbtn"  onClick = {DeleteUserInfo}>Delete User!</button>
            </div>
            <span className = "MainAccountSet" id = "fname">Firstname</span>
            <input type = "text" id = "firstname" className = "AccountSet" value = {userFirst} readOnly/>
            <span className = "MainAccountSet" id = "lname">Lastname</span>
            <input type = "text" id = "lastname" className = "AccountSet" value = {userLast}  readOnly/>
            <span className = "MainAccountSet" id = "email">Email</span>
            <input type = "text" id = "Accountemail" className = "AccountSet" value = {userEmail} readOnly/>
            
            
            <div id = "buttonbar">
                <button type = "button" id = "edituser" className = "button" onClick = {showEdit}>Edit User</button>
                <button type = "button" id = "deleteuser" className = "button" onClick = {showDelete}>Delete User</button>
            </div>

        </div>
    );
};


export default AccountSettings;