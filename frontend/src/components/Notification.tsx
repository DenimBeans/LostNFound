import React, { useState } from 'react';
import { buildAPIPath } from './Path';
import { useEffect } from 'react';
import { useRef } from 'react';
import '../Styles/Notification.css';

function Notification() {

    interface NotifData {
        _id: string;
        title: string;
        description: string;
        category: string;
        imageUrl: string;

        text: string;
        isMeetup: boolean;
        isRead: boolean;
        location: string;
        meetTime: Date;
        senderId: string;
        itemId: string;


    }

    const ViewNotIf = useRef<HTMLDivElement>(null);
    const ViewNotIfButton = useRef<HTMLDivElement>(null);
    const Contest = useRef<HTMLDivElement>(null);

    const [NotifContainer, setNotifContainer] = useState<NotifData[]>([]);

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    const [viewNotifId, setviewNotifId] = React.useState('');
    //contest
    const [contestLocation, setContestLocation] = React.useState('');
    const [contestTime, setContestTime] = React.useState('');
    //View notification
    const [NotifTitle, setNotifTitle] = React.useState('');
    const [NotifDescription, setNotifDescription] = React.useState('');
    const [NotifCategory, setNotifCategory] = React.useState('');
    const [NotifImageUrl, setNotifImageUrl] = React.useState('');
    const [NotifMeetLoc, setNotifMeetLoc] = React.useState('');
    const [NotifMeetTime, setNotifMeetTime] = React.useState('');

    function handleContestLocation(e: any) {
        setContestLocation(e.target.value);
    }

    function handleContestDate(e: any) {
        setContestTime(e.target.value);
    }

    async function AllNotif(id: any) {
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
        if (Data != null) {
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            AllNotif(UserData?.userId);
        }
        else {
            window.location.href = '/';
        }
    }, []);


    async function Read(NotId: any) {

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

    async function Delete(NotId: any) {
        try {
            const response = await fetch(buildAPIPath(`api/notifications/${NotId}`),
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                console.log(res.error)
            }
            else {
                setNotifContainer(NotifContainer.filter((NotifContainer) => NotifContainer._id != NotId))
            }


        }
        catch (error: any) {
            console.log(error.toString());
        }
    };


    async function ReadAll() {
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

    async function DeleteAll() {
        try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}/notifications`),
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                console.log(res.error)
            }
            else {
                setNotifContainer([])
            }


        }
        catch (error: any) {
            console.log(error.toString());
        }
    };

    async function View(Notif: any) {

        if (ViewNotIf.current) {
            ViewNotIf.current.style.visibility = 'visible';
            if (Notif.isMeetup == false && ViewNotIfButton.current) {
                ViewNotIfButton.current.style.visibility = 'none';
            }
            else if (Notif.isMeetup == true && ViewNotIfButton.current) {
                ViewNotIfButton.current.style.visibility = 'visible';
            }
        }
        setviewNotifId(Notif)
        setNotifTitle(Notif.itemId.title);
        setNotifDescription(Notif.itemId.description);
        setNotifCategory(Notif.itemId.category);
        setNotifImageUrl(Notif.itemId.imageUrl);
        setNotifMeetLoc(Notif.location);
        var date = new Date(Notif.meetTime)
        
        let Day = date.getDate();
        let Month = date.getMonth()+1;
        let Year = date.getFullYear();
        if (Day < 10){
            Day = `0${Day}`
        }
        if (Month < 10){
            Month = `0${Month}`
        }
        let FormatedDate = (Month+'/'+Day+'/'+Year);
        setNotifMeetTime(FormatedDate);

    };

    async function StartContest(Notif: any) {
        if (Contest.current) {
            Contest.current.style.visibility = 'visible';
        }
        setContestLocation(Notif.location);
        setContestTime(Notif.meetTime);
    };

    async function ReturnNotif(Notif: any, answer: string) {
        if (answer == "Accept") {
            let obj = {
                userId: Notif.senderId._id,
                text: Notif.text,
                isMeetup: Notif.isMeetup,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    window.location.reload();
                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }
        else if (answer == "Contest") {
            let obj = {
                userId: Notif.senderId._id,
                text: Notif.text,
                isMeetup: Notif.isMeetup,
                location: contestLocation,
                meetTime: contestTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    window.location.reload();
                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }
        else if (answer == "Deny") {
            let obj = {
                userId: Notif.senderId._id,
                text: Notif.text,
                isMeetup: Notif.isMeetup,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    window.location.reload();
                }
            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }


    };

    return (
        <div id="NotificationMain">
            <div id="NotifPage">
                {NotifContainer.map(NotifContainer => (
                    <div key={NotifContainer._id} className="NotifContainers">
                        <input type="text" id="NotificationTitle" className="NotTitle" value={NotifContainer.text} readOnly />
                        <input type="text" id="NotificationMeetup" className="NotTitle" value={NotifContainer.isRead} readOnly />
                        <button type="button" id="NotificationView" className = "NotIfBtn" onClick={() => View(NotifContainer)}>View Report</button>
                        <button type="button" id="NotificationRead" className = "NotIfBtn" onClick={() => Read(NotifContainer._id)}>Read</button>
                        <button type="button" id="NotificationDelete" className = "NotIfBtn" onClick={() => Delete(NotifContainer._id)}>Delete</button>
                    </div>
                ))}

            </div>
            <div id="ViewNotIf" ref={ViewNotIf}>

                <input type="text" id="NotifTitle" className="NotifData" value={NotifTitle} readOnly />
                <input type="text" id="NotifDesc" className="NotifData" value={NotifDescription} readOnly />
                <input type="text" id="NotifCat" className="NotifData" value={NotifCategory} readOnly />
                <input type="text" id="NotifImage" className="NotifData" value={NotifImageUrl} readOnly />
                <span id = "MeetUpInfo">MeetUp Info</span>
                <input type="text" id="NotifLoc" className="NotifData" value={NotifMeetLoc} readOnly />
                <input type="text" id="NotifTime" className="NotifData" value={NotifMeetTime} readOnly />
                <div id="ViewButtonBar" ref={ViewNotIfButton}>
                    <button type="button" id="NotifAccept" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Accept")}>Accept</button>
                    <button type="button" id="NotifContest" className="NotifButton" onClick={() => StartContest(viewNotifId)}>Contest</button>
                    <button type="button" id="NotifDeny" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Deny")}>Deny</button>
                </div>
            </div>
            <div id="Contest" ref={Contest}>
                <input type="text" id="ContestLocation" className="Contest" onChange={handleContestLocation} />
                <input type="date" id="ContestTime" className="Contest" onChange={handleContestDate} />
                <button type="button" id="SubmitContest" onClick={() => ReturnNotif(viewNotifId, "Contest")}>Submit new contest</button>
            </div>
            <div id="buttonholder">
                <button type="button" className="bottombutton" onClick={ReadAll}>Read-ALL</button>
                <button type="button" className="bottombutton" onClick={DeleteAll}>Delete-ALL</button>
            </div>
        </div>
    );
};


export default Notification;