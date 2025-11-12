import React, { useState} from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';

function AccountSettings(){
    
    useEffect(() => {
        const Data = sessionStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            searchItem(true);
        }
        else{
            window.location.href = '/';
        }
    },[]);




    return(
        <h1>AccountSetting</h1>
    );
};


export default AccountSettings;