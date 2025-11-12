import React, { useState, useMemo, useCallback } from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';
import '../Styles/MainPage.css';
import '../Styles/FrontPage.css';

//Map imports - Jean
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {LatLng, Icon} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from "leaflet/dist/images/marker-icon.png";

function CardUI() {
    const AddPopupRef = useRef<HTMLDivElement>(null);
    const EditPopupRef = useRef<HTMLDivElement>(null);
    const ViewPopupRef = useRef<HTMLDivElement>(null);

    interface ContainerData{
        _id : string;
        title : string;
        description : string;
        category : string;
        status : string;
        imageUrl: string;
        locationText: string;
    }

    const [message, setMessage] = useState('');
    const [repMessage, setRepMessage] = useState('');
    
    const [ItemContainer,setItemContainer] = useState<ContainerData[]>([]);

    const [CurEditItem,setCurEditItem] = React.useState('');

    //SearchBar
    const [status,setstatus] = React.useState('');
    const [Category,setCategory] = React.useState('');
    const [Search,setSearchItem] = React.useState('');

    //View
    const [VitemTitle, setItemNameValueV] = React.useState('');
    const [VitemDesc, setItemDescValueV] = React.useState('');
    const [VitemCat, setItemCatValueV] = React.useState('');
    const [VitemImage, setItemImageValueV] = React.useState('');
    const [VitemLocation, setLocationValueV] = React.useState('');


    //Edit
    const [EitemTitle, setItemNameValueE] = React.useState('');
    const [EitemDesc, setItemDescValueE] = React.useState('');
    const [EitemCat, setItemCatValueE] = React.useState('');
    const [EitemImage, setItemImageValueE] = React.useState('');
    const [EitemLocation, setLocationValueE] = React.useState('');


    //Add
    const [itemTitle, setItemNameValue] = React.useState('');
    const [itemDesc, setItemDescValue] = React.useState('');
    const [itemCat, setItemCatValue] = React.useState('');
    const [itemImage, setItemImageValue] = React.useState('');
    const [itemLocation, setLocationValue] = React.useState('');
    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    const ucfCoords:LatLng = new LatLng(28.6024, -81.2001);
    const [position, setPosition] = useState(ucfCoords);

    async function ItemPage(Item: any): Promise<void>{
        if (ViewPopupRef.current){
            
            setItemNameValueV(Item.title);
            setItemDescValueV(Item.description);
            setItemCatValueV(Item.category);
            setItemImageValueV(Item.imageUrl);
            setLocationValueV(Item.locationText)
            ViewPopupRef.current.style.visibility = 'visible';
        }
    }

    async function EditPage(Item: any): Promise<void>{
        if (EditPopupRef.current){
            setCurEditItem(Item._id);
            setItemNameValueE(Item.title);
            setItemDescValueE(Item.description);
            setItemCatValueE(Item.category);
            setItemImageValueE(Item.imageUrl);
            setLocationValueE(Item.locationText);
            EditPopupRef.current.style.visibility = 'visible';
        }
    }

    async function exitReport(){
        if (AddPopupRef.current){
            AddPopupRef.current.style.visibility = 'hidden';
        }
    }

    async function exitReportEdit(){
        if (EditPopupRef.current){
            EditPopupRef.current.style.visibility = 'hidden';
        }
    }

    async function ViewexitReport(){
        if (ViewPopupRef.current){
            ViewPopupRef.current.style.visibility = 'hidden';
        }
    }


    async function EditItem(){

        
        
        let obj = { title: itemTitle,description: itemDesc,category: itemCat,imageUrl: itemImage,lat: position.lat,
            lng: position.lng, locationText: itemLocation,userId: itemUSERID };
        let js = JSON.stringify(obj);

         try {
            const response = await fetch(buildAPIPath(`api/items/${CurEditItem}`),
                { method: 'PATCH', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                setRepMessage(res.error)
            }
            else {
                if (EditPopupRef.current){
                    EditPopupRef.current.style.display = 'none';
                }
                setItemNameValue('');
                setItemDescValue('');
                setItemCatValue('');
                setItemImageValue('');
                setLocationValue('');
            }
        }
        catch (error: any) {
            setRepMessage(error.toString());
        }


    }

    async function DeleteItem(itemId : String): Promise<void>{
        let obj = {id: itemId}
        let js = JSON.stringify(obj)

        try {
            const response = await fetch(buildAPIPath(`api/items/${itemId}`),
                { method: 'DELETE', body: js, headers: { 'Content-Type': 'application/json' } });
            
            let txt = await response.text();
            let res = JSON.parse(txt);

            if(res.error != ''){
                setMessage(res.error)
            }
            else{
                setItemContainer(ItemContainer.filter((ItemContainer) => ItemContainer._id != itemId))
            }

            
        }
        catch (error: any) {
            setMessage(error.toString());
        }
    };

    async function addItem(e: any): Promise<void> {
        e.preventDefault();

        let obj = { title: itemTitle,description: itemDesc,category: itemCat,imageUrl: itemImage,lat: position.lat,
            lng: position.lng, locationText: itemLocation,userId: itemUSERID };
        let js = JSON.stringify(obj);

        try {
            const response = await fetch(buildAPIPath('api/items'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                setRepMessage(res.error)
            }
            else {
                if (AddPopupRef.current){
                    AddPopupRef.current.style.display = 'none';
                }
            }
        }
        catch (error: any) {
            setRepMessage(error.toString());
        }
    };

    async function searchItem(e: any): Promise<void> {
        e.preventDefault();

        try {
            const response = await fetch(buildAPIPath(`api/users/${itemUSERID}/items`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setItemContainer(res.results);
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
    };

    async function searchItemSpecific(e: any): Promise<void>{
         e.preventDefault();

        setItemContainer([])

        try {
            const response = await fetch(buildAPIPath(`api/items?status=${status}&category=${Category}&search=${Search}`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setItemContainer(res.results);
            }
            catch (error: any) {
            console.log("Frontend Error");
        }
    }
    //All for searchbar
    function handleStatusChange(e: any): void{
        setstatus(e.target.value);
    }
    function handleCategoryChange(e: any): void{
        setCategory(e.target.value);
   }  
   function handleSearchItemChange(e: any): void{
        setSearchItem(e.target.value);
   }

    //add
    function handleItemTextChange(e: any): void {
        setItemNameValue(e.target.value);
    }
    function handleDescTextChange(e: any): void {
        setItemDescValue(e.target.value);
    }
    function handleItemCatChange(e: any): void {
        setItemCatValue(e.target.value);
    }
    function handleItemImageChange(e: any): void {
        setItemImageValue(e.target.value);
    }

    function handleLocationTextChange(e: any): void {
        setLocationValue(e.target.value);
    }

    //Edit
    function EdithandleItemTextChange(e: any): void {
        setItemNameValueE(e.target.value);
    }
    function EdithandleDescTextChange(e: any): void {
        setItemDescValueE(e.target.value);
    }
    function EdithandleItemCatChange(e: any): void {
        setItemCatValueE(e.target.value);
    }
    function EdithandleItemImageChange(e: any): void {
        setItemImageValueE(e.target.value);
    }

    function EdithandleLocationTextChange(e: any): void {
        setLocationValueE(e.target.value);
    }


    //Grab userid
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
    
    //  Draggable marker for map
    function DraggableMarker() {
        const [draggable, setDraggable] = useState(false)
        const markerRef = useRef<any>(null)
        const eventHandlers = useMemo(
            () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    setPosition(marker.getLatLng())
                }
            },
            }),
            [],
        )
        const toggleDraggable = useCallback(() => {
            setDraggable((d) => !d)
        }, [])

        return (
            <Marker
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon = {new Icon ((
            {
                iconUrl: markerIconPng, 
                iconSize: [25, 41], 
            }))}>
                <Popup minWidth={90}>
                    <span onClick={toggleDraggable}>
                    {draggable
                        ? `Marker is draggable!`
                        : 'Click here to make marker draggable.'}
                    </span>
                </Popup>
            </Marker>
        )
    }

    return (
        <div id="MainUIDiv">
            <div id = "SearchBar">
                <select id = 'category'  onChange = {handleStatusChange}>
                    <option value = " ">Select Option</option>
                    <option value = "lost">Lost</option>
                    <option value = "found">Found</option>
                </select>
                <select id = 'category'  onChange = {handleCategoryChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>
                <input type = "text" id = "Searchtab" placeholder = "Search..." onChange = {handleSearchItemChange}/>
                <button type = "button" id = "SearchItem" onClick = {searchItemSpecific}>Search</button>
            </div>

            <div id = "LostItemPage">
                {ItemContainer.map(ItemContainer => (
                    <div key = {ItemContainer._id} className = "ItemContainers">
                        <input type = "text" id = "ContainerTitle" value = {ItemContainer.title} readOnly/>
                        <button type = "button" id = "ContainerData" onClick = {() => ItemPage(ItemContainer)}>Info</button>
                        <button type = "button" id = "ContainerEdit" onClick = {() => EditPage(ItemContainer)}>Edit</button>
                        <button type = "button" id = "ContainerDelete" onClick = {() => DeleteItem(ItemContainer._id)}>Delete</button>
                        <input type = "text" id = "ContainerStatus" value = {ItemContainer.status} readOnly/>
                    </div>
                ))}
                
            </div>

            <div id = "AddItemPopup" ref = {AddPopupRef}>
                <button type = "button" id="exitReport" onClick={() => exitReport()}>X</button>
                <h2 id = 'reportHeader'>Lost Item Report</h2>

                <span id="itemAddResult">{repMessage}</span>

                <MapContainer id = "map" center = {ucfCoords} zoom={17} scrollWheelZoom={false} placeholder>
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DraggableMarker/>
                </MapContainer>

                <input type="text" id="itemTitle" value = {itemTitle} placeholder="Item Name"
                    onChange={handleItemTextChange} />

                <textarea 
                    id="Desc" 
                    value = {itemDesc}
                    placeholder="Item Description"
                    onChange={handleDescTextChange}>
                </textarea>

                <input type="text" id = "locationText" value= {itemLocation} placeholder = "Building Name/Classroom Number/Floor" 
                    onChange = {handleLocationTextChange}></input>

                <select id = 'category' value = {itemCat} onChange = {handleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>

                <input type="text" id = "ImageUp" value = {itemImage} placeholder = "Image URL" 
                    onChange = {handleItemImageChange}></input>

                <input type = "button" id="reportButton" className = "button"
                    onClick={addItem} value = "Submit"/>
                
            </div>

            <div id = "EditItemPopup" ref = {EditPopupRef}>
                <button type = "button" id="exitReportEdit" onClick={() => exitReportEdit()}>X</button>
                <h2 id = 'reportHeader'>Lost Item Report</h2>

                <span id="itemAddResult">{repMessage}</span>

                <MapContainer id = "map" center = {ucfCoords} zoom={17} scrollWheelZoom={false} placeholder>
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DraggableMarker/>
                </MapContainer>

                <input type="text" id="itemTitle" value= {EitemTitle} placeholder="Item Name"
                    onChange={EdithandleItemTextChange} />

                <textarea 
                    id="Desc" 
                    value = {EitemDesc}
                    placeholder="Item Description"
                    onChange={EdithandleDescTextChange}>
                </textarea>

                <input type="text" id = "locationText" value = {EitemLocation} placeholder = "Building Name/Classroom Number/Floor" 
                    onChange = {EdithandleLocationTextChange}></input>

                <select id = 'category' value = {EitemCat} onChange = {EdithandleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>

                <input type="text" id = "ImageUp" value = {EitemImage} placeholder = "Image URL" 
                    onChange = {EdithandleItemImageChange}></input>

                <input type = "button" id="reportButton" className = "button"
                    onClick={EditItem} value = "Submit"/>
                
            </div>

            <div id = "ViewItemPopup" ref = {ViewPopupRef}>
                <button type = "button" id="ViewReportView" onClick={() => ViewexitReport()}>X</button>
                <h2 id = 'reportHeader'>Lost Item Report</h2>

                <span id="itemAddResult">{repMessage}</span>

                <MapContainer id = "map" center = {ucfCoords} zoom={17} scrollWheelZoom={false} placeholder>
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DraggableMarker/>
                </MapContainer>

                <input type="text" id="itemTitle" value= {VitemTitle} placeholder="Item Name" readOnly/>

                <textarea 
                    id="Desc" 
                    value = {VitemDesc}
                    placeholder="Item Description">
                    readOnly
                </textarea>

                <input type="text" id = "locationText" value = {VitemLocation} placeholder = "Building Name/Classroom Number/Floor" readOnly/>

                <input type = "text" id = "CategoryView" value = {VitemCat} readOnly/>
                    
                <input type="text" id = "ImageUp" value = {VitemImage} placeholder = "Image URL" readOnly/>
                
            </div>

           <div id = "ButtonHolster">
                <input type="button" id="addItemButton" className="button"
                    onClick={ItemPage} value = "Begin Report"/>

                <input type="button" id="searchItemButton" className="button"
                    onClick={searchItem} value = "Display All Items"></input>
           </div>

            <br />
                <span id="itemAddResult">{message}</span>
            <br />
            
        </div>

    );
}

export default CardUI;
