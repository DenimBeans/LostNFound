//Uncomment as needed. - Jean

import React/*, { useState}*/ from 'react';
//import { buildAPIPath } from './Path';
import {useEffect} from 'react';
//import {useRef} from 'react';

function AccountSettings(){

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

    //Temporarily displaying itemUSERID so that compiler runs. 
    // Feel free to change once variable is used elsewhere. - Jean
    return(
        <h1>AccountSetting {itemUSERID}</h1>
    );
};


export default AccountSettings;