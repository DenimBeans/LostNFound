import React, { useState} from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';

function Notification(){


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
        <div id = "NotificationMain">
            
            
            <div id = "buttonholder">
                <button type = "button" id = "deleteAllNotif">Delete</button>
            </div>
        </div>
    );
};


export default Notification;