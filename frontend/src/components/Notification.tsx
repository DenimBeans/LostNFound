import React, { useState } from 'react';
import { buildAPIPath } from './Path';
import { useEffect } from 'react';
import { useRef } from 'react';
import '../Styles/Notification.css';
import Empty from '../assets/EmptyIcon.webp'

function Notification() {

    // Helper function to format ISO 8601 string as EST time
    // Hardcoded EST (UTC-5) to ensure consistency across all devices
    const formatTimeAsEST = (isoString: string): string => {
        const date = new Date(isoString);
        // The isoString comes from backend as UTC (with Z suffix)
        // Hardcode UTC-5 offset to ensure consistent EST display
        const estTime = new Date(date.getTime() - (5 * 60 * 60 * 1000));
        const day = String(estTime.getUTCDate()).padStart(2, '0');
        const month = String(estTime.getUTCMonth() + 1).padStart(2, '0');
        const year = estTime.getUTCFullYear();
        const hours = String(estTime.getUTCHours()).padStart(2, '0');
        const minutes = String(estTime.getUTCMinutes()).padStart(2, '0');
        return `${month}/${day}/${year} ${hours}:${minutes} EST`;
    };

    interface NotifData {

        text: string;
        isMeetup: boolean;
        isRead: boolean;
        location: string;
        meetTime: Date;
        senderId: { _id: string; firstName: string; lastName: string; }
        itemId: { _id: string; title: string; description: string; category: string; imageUrl: string; }



    }
    const NotifPage = useRef<HTMLDivElement>(null);
    const NoNotif = useRef<HTMLDivElement>(null);

    const ViewNotIf = useRef<HTMLDivElement>(null);
    const ViewNotIfButton = useRef<HTMLDivElement>(null);
    const Contest = useRef<HTMLDivElement>(null);
    const meettime = useRef<HTMLInputElement>(null);
    



    const [NotifContainer, setNotifContainer] = useState<NotifData[]>([]);

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    const [viewNotifId, setviewNotifId] = React.useState('');
    //contest
    const [contestLocation, setContestLocation] = React.useState('');
    const [contestTime, setContestTime] = React.useState<Date | null>(null);
    //View notification
    const [NotifMain, setNotifMain] = React.useState('');

    const [Sender, setSender] = React.useState('');

    const [NotifTitle, setNotifTitle] = React.useState('');
    const [NotifDescription, setNotifDescription] = React.useState('');
    const [NotifCategory, setNotifCategory] = React.useState('');
    const [NotifImageUrl, setNotifImageUrl] = React.useState('');

    const [NotifMeetLoc, setNotifMeetLoc] = React.useState('');
    const [NotifMeetTime, setNotifMeetTime] = React.useState('');

    function handleContestLocation(e: any) {
        setContestLocation(e.target.value);
    }

    function handleContestDate(e: React.ChangeEvent<HTMLInputElement>) {
        setContestTime(new Date(e.target.value));
    }

    async function exit() {
        if (ViewNotIf.current) {
            ViewNotIf.current.style.visibility = 'hidden';
            ViewNotIfButton.current.style.visibility = 'hidden';
        }

    }

    async function exitContest() {
        if (Contest.current) {
            Contest.current.style.visibility = 'hidden';
            ViewNotIfButton.current.style.visibility = 'hidden';
        }

    }

    async function AllNotif(id: any) {
        try {
            const response = await fetch(buildAPIPath(`api/users/${id}/notifications`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setNotifContainer(res.results);
            if (res.count == 0) {
                NoNotif.current.style.display = 'flex';
                NotifPage.current.style.display = 'none';
            }
            else {
                NoNotif.current.style.display = 'none';
                NotifPage.current.style.display = 'flex';

            }
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
                AllNotif(itemUSERID);
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
                NotifPage.current.style.display = 'none';
                NoNotif.current.style.display = 'flex';
            }


        }
        catch (error: any) {
            console.log(error.toString());
        }
    };

    async function View(Notif: any) {
        console.log(Notif);
        setNotifContainer(NotifContainer.map((j) => j._id === Notif._id ? { ...j, isRead: true } : j));
        Read(Notif._id);
        if (ViewNotIf.current) {
            ViewNotIf.current.style.visibility = 'visible';
            if (Notif.isMeetup === false && ViewNotIfButton.current) {
                meettime.current.style.display = 'none'
                ViewNotIfButton.current.style.visibility = 'hidden';
            }
            else if (Notif.isMeetup === true && ViewNotIfButton.current) {
                ViewNotIfButton.current.style.visibility = 'visible';
                meettime.current.style.display = 'flex'
            }
        }
        setviewNotifId(Notif)

        setNotifMain(Notif.text)

        setSender(`${Notif.senderId.firstName}  ${Notif.senderId.lastName}`);

        setNotifTitle(Notif.itemId.title);
        setNotifDescription(Notif.itemId.description);
        setNotifCategory(Notif.itemId.category);
        setNotifImageUrl(Notif.itemId.imageUrl);

        setNotifMeetLoc(Notif.location);
        if (Notif.meetTime != null) {
            setNotifMeetTime(formatTimeAsEST(Notif.meetTime));
        }
        else {
            setNotifMeetTime('');
        }

    };

    async function StartContest(Notif: any) {
        console.log(Notif);
        if (Contest.current) {
            Contest.current.style.visibility = 'visible';
        }

    };

    async function ReturnNotif(Notif: any, answer: string) {
        console.log(Notif);

        const NotifId = Notif._id;
        if (answer == "Accept") {
            let formattedTime = Notif.meetTime ? formatTimeAsEST(Notif.meetTime) : Notif.meetTime;
            let Response = `The meetup was accepted, will be held at ${Notif.location} on ${formattedTime}.`;
            let Self = `You have accepted this meetup at ${Notif.location} on ${formattedTime}.`;
            let obj = {
                userId: Notif.senderId._id,
                text: Response,
                isMeetup: false,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);

            let objRet = {
                userId: itemUSERID,
                text: Self,
                isMeetup: false,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let jsRet = JSON.stringify(objRet);

            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {

                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
            //Sent Back to user to log
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: jsRet, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    Delete(NotifId);
                    ViewNotIf.current.style.visibility = 'hidden';
                    ViewNotIfButton.current.style.visibility = 'hidden';
                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }
        else if (answer == "Contest") {
            let formattedOriginalTime = Notif.meetTime ? formatTimeAsEST(Notif.meetTime) : Notif.meetTime;
            let formattedContestTime = contestTime ? formatTimeAsEST(contestTime.toISOString()) : contestTime;
            let Response = `The meetup at ${Notif.location} on ${formattedOriginalTime} was contested.`
            let Self = `You contested the meetup  with new information: ${contestLocation} on ${formattedContestTime}.`
            let obj = {
                userId: Notif.senderId._id,
                text: Response,
                isMeetup: true,
                location: contestLocation,
                meetTime: contestTime ? contestTime.toISOString() : null,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);

            let objRet = {
                userId: itemUSERID,
                text: Self,
                isMeetup: false,
                location: contestLocation,
                meetTime: contestTime ? contestTime.toISOString() : null,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let jsRet = JSON.stringify(objRet);
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {

                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
            //Sent Back to user to log
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: jsRet, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    Delete(NotifId);
                    Contest.current.style.visibility = 'hidden';
                    ViewNotIf.current.style.visibility = 'hidden';
                    ViewNotIfButton.current.style.visibility = 'hidden';
                }

            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }
        else if (answer == "Deny") {
            let formattedTime = Notif.meetTime ? formatTimeAsEST(Notif.meetTime) : Notif.meetTime;
            let Response = `Your meetup request has been rejected.`
            let Self = `You have denied this meetup at ${Notif.location} on ${formattedTime}.`
            let obj = {
                userId: Notif.senderId._id,
                text: Response,
                isMeetup: false,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);

            let objRet = {
                userId: itemUSERID,
                text: Self,
                isMeetup: false,
                location: Notif.location,
                meetTime: Notif.meetTime,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let jsRet = JSON.stringify(objRet);
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {

                }
            }


            catch (error: any) {
                console.log("Frontend Error");
            }
            //Log back to user
            try {
                const response = await fetch(buildAPIPath(`api/notifications`),
                    { method: 'POST', body: jsRet, headers: { 'Content-Type': 'application/json' } });

                let txt = await response.text();
                let res = JSON.parse(txt);

                if (res.error != '') {
                    console.log(res.error)
                }
                else {
                    Delete(NotifId);
                    ViewNotIf.current.style.visibility = 'hidden';
                    ViewNotIfButton.current.style.visibility = 'hidden';

                }
            }


            catch (error: any) {
                console.log("Frontend Error");
            }
        }


    };

    return (
        <div id="NotificationMain">
            <div id="NotifPage" ref={NotifPage}>
                {NotifContainer.map(NotifContainer => (
                    <div key={NotifContainer._id} className="NotifContainers">
                        <input type="text" style={{opacity : NotifContainer.isRead ? 0.7 : 1}} id="NotificationTitle" className="NotTitle" value={NotifContainer.text} readOnly />
                        
                        <button type="button" id="NotificationView" className="NotIfBtn" onClick={() => View(NotifContainer)}></button>
                        <button type="button" id="NotificationRead" className="NotIfBtn" onClick={() => Read(NotifContainer._id)}>Read</button>
                        <button type="button" id="NotificationDelete" className="NotIfBtn" onClick={() => Delete(NotifContainer._id)}></button>
                    </div>
                ))}

            </div>
            <div id="NoNotif" ref={NoNotif}>
                <img alt="EmptyNotifications" src={Empty} id="EmptyNotifications" />
            </div>
            <div id="ViewNotIf" ref={ViewNotIf}>
                <button type="button" id="exit" onClick={() => exit()}>X</button>

                <span id="Intro">Notification Details</span>
                <textarea id="NotifMain" value={NotifMain} readOnly></textarea>

                <span id="SenderInfo">From</span>
                <input type='text' id='from' className="NotifData" value={Sender} readOnly></input>

                <span id="ItemInfo">Item Info</span>
                <input type="text" id="NotifTitle" className="NotifData" value={NotifTitle} readOnly />
                <input type="text" id="NotifDesc" className="NotifData" value={NotifDescription} readOnly />
                <input type="text" id="NotifCat" className="NotifData" value={NotifCategory} readOnly />
                <input type="text" id="NotifImage" className="NotifData" value={NotifImageUrl} readOnly />

                <span id="MeetUpInfo" ref = {meettime} >MeetUp Info</span>

                <input type="text" id="NotifLoc" ref = {meettime} className="NotifMeetUp" value={NotifMeetLoc} readOnly />
                <input type="text" id="NotifTime" ref = {meettime} className="NotifMeetUp" value={NotifMeetTime} readOnly />

                <div id="ViewButtonBar" ref={ViewNotIfButton}>
                    <button type="button" id="NotifAccept" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Accept")}>Accept</button>
                    <button type="button" id="NotifContest" className="NotifButton" onClick={() => StartContest(viewNotifId)}>Contest</button>
                    <button type="button" id="NotifDeny" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Deny")}>Deny</button>
                </div>
            </div>

            <div id="Contest" ref={Contest}>
                <button type="button" id="exit" onClick={() => exitContest()}>X</button>
                <input type="text" id="ContestLocation" className="Contest" onChange={handleContestLocation} />
                <input type="datetime-local" id="ContestTime" className="Contest" onChange={handleContestDate} />
                <button type="button" id="SubmitContest" onClick={() => ReturnNotif(viewNotifId, "Contest")}>Submit new contest</button>
            </div>

            <div id="buttonholder">
                <button type="button" className="bottombutton" id="readAll" onClick={ReadAll}></button>
                <button type="button" className="bottombutton" id="deleteAll" onClick={DeleteAll}></button>
            </div>
        </div>
    );
};


export default Notification;