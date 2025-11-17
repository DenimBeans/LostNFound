import React, { useState } from 'react';
import { buildAPIPath } from './Path';
import { useEffect } from 'react';
import { useRef } from 'react';
import '../Styles/Notification.css';
import Empty from '../assets/EmptyIcon.webp'

function Notification() {

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

    

    const [NotifContainer, setNotifContainer] = useState<NotifData[]>([]);

    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    const [viewNotifId, setviewNotifId] = React.useState('');
    //contest
    const [contestLocation, setContestLocation] = React.useState('');
    const [contestTime, setContestTime] = React.useState<Date | null >(null);
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

    async function exit(){
        if(ViewNotIf.current){
                ViewNotIf.current.style.visibility = 'hidden';
                ViewNotIfButton.current.style.visibility = 'hidden';
        }
        
    }

    async function exitContest(){
        if(Contest.current){
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
            if(res.count == 0){
                NoNotif.current.style.display = 'flex';
                NotifPage.current.style.display = 'none';
            }
            else{
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
        setNotifContainer(NotifContainer.map((j) => j._id === Notif._id ? {...j,isRead: true}: j));
        Read(Notif._id);
        if (ViewNotIf.current) {
            ViewNotIf.current.style.visibility = 'visible';
            if (Notif.isMeetup === false  && ViewNotIfButton.current) {
                ViewNotIfButton.current.style.visibility = 'hidden';
            }
            else if (Notif.isMeetup === true  && ViewNotIfButton.current) {
                ViewNotIfButton.current.style.visibility = 'visible';
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
            var date = new Date(Notif.meetTime)

            let Day = String(date.getDate()).padStart(2, '0');
            let Month = String(date.getMonth() + 1).padStart(2, '0');
            let Year = date.getFullYear()
            let Hour = String(date.getHours()).padStart(2, '0');
            let Minutes = String(date.getMinutes()).padStart(2, '0');


            setNotifMeetTime(`${Month}/${Day}/${Year}--${Hour}:${Minutes}`);
        }
        else{
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
            let Response = `Meeting accepted, Location at ${Notif.location} and the meeting will take place at ${Notif.meetTime}.`
            let Self = `You have accepted this meeting at Location at ${Notif.location} and the meeting will take place at ${Notif.meetTime}.`
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
                text: self,
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
            let Response = `The meetup at ${Notif.location} at the time ${Notif.meetTime} was contested.`
            let Self = `You contested the meetup with new information, Location: ${contestLocation} Time: ${contestTime}`
            let obj = {
                userId: Notif.senderId._id,
                text: Response,
                isMeetup: Notif.isMeetup,
                location: contestLocation,
                meetTime: contestTime ? contestTime.toISOString(): null,
                senderId: itemUSERID,
                itemId: Notif.itemId,

            };
            let js = JSON.stringify(obj);

            let objRet = {
                userId: itemUSERID,
                text: Self,
                isMeetup: false,
                location: contestLocation,
                meetTime: contestTime ? contestTime.toISOString(): null,
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
            let Response = `This meetup has been rejected.`
            let Self = `You have denied this meeting at the location ${Notif.location} at the time of ${Notif.meetTime}`
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
            <div id="NotifPage" ref = {NotifPage}>
                {NotifContainer.map(NotifContainer => (
                    <div key={NotifContainer._id} className="NotifContainers">
                        <input type = "text" id="NotificationTitle" className="NotTitle" value={NotifContainer.text} readOnly/>
                        <input type="text" id="NotificationMeetup" className="NotTitle" value={NotifContainer.isRead} readOnly />
                        <button type="button" id="NotificationView" className="NotIfBtn" onClick={() => View(NotifContainer)}>View Report</button>
                        <button type="button" id="NotificationRead" className="NotIfBtn" onClick={() => Read(NotifContainer._id)}>Read</button>
                        <button type="button" id="NotificationDelete" className="NotIfBtn" onClick={() => Delete(NotifContainer._id)}>Delete</button>
                    </div>
                ))}

            </div>
            <div id = "NoNotif" ref = {NoNotif}>
                <img alt = "EmptyNotifications" src = {Empty} id = "EmptyNotifications"/>
            </div>
            <div id="ViewNotIf" ref={ViewNotIf}>
                <button type = "button" id="exit" onClick={() => exit()}>X</button>

                <span id="Intro">Notification Details</span>
                <textarea id="NotifMain" value = {NotifMain} readOnly></textarea>

                <span id="SenderInfo">From</span>
                <input type = 'text' id = 'from' className="NotifData" value = {Sender} readOnly></input>

                <span id="ItemInfo">Item Info</span>
                <input type="text" id="NotifTitle" className="NotifData" value={NotifTitle} readOnly />
                <input type="text" id="NotifDesc" className="NotifData" value={NotifDescription} readOnly />
                <input type="text" id="NotifCat" className="NotifData" value={NotifCategory} readOnly />
                <input type="text" id="NotifImage" className="NotifData" value={NotifImageUrl} readOnly />

                <span id="MeetUpInfo">MeetUp Info</span>

                <input type="text" id="NotifLoc" className="NotifMeetUp" value={NotifMeetLoc} readOnly />
                <input type="text" id="NotifTime" className="NotifMeetUp" value={NotifMeetTime} readOnly />

                <div id="ViewButtonBar" ref={ViewNotIfButton}>
                    <button type="button" id="NotifAccept" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Accept")}>Accept</button>
                    <button type="button" id="NotifContest" className="NotifButton" onClick={() => StartContest(viewNotifId)}>Contest</button>
                    <button type="button" id="NotifDeny" className="NotifButton" onClick={() => ReturnNotif(viewNotifId, "Deny")}>Deny</button>
                </div>
            </div>

            <div id="Contest" ref={Contest}>
                <button type = "button" id="exit" onClick={() => exitContest()}>X</button>
                <input type="text" id="ContestLocation" className="Contest" onChange={handleContestLocation} />
                <input type="datetime-local" id="ContestTime" className="Contest" onChange={handleContestDate} />
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