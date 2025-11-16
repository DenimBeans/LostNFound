import React, { useState, useMemo, useCallback } from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';
import '../Styles/MainPage.css';
import '../Styles/FrontPage.css';

//Map imports - Jean
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {LatLng, Icon} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from "../assets/marker-icon.png";

function CardUI() {
    const LostItemPage = useRef<HTMLDivElement>(null);
    const NoItemPage = useRef<HTMLDivElement>(null);
    const AddPopupRef = useRef<HTMLDivElement>(null);
    const EditPopupRef = useRef<HTMLDivElement>(null);
    const ViewPopupRef = useRef<HTMLDivElement>(null);

    const imageViewRef = useRef<HTMLDivElement>(null);

    interface ContainerData{
        _id : string;
        title : string;
        description : string;
        category : string;
        status : string;
        imageUrl: string;
    }

    const [message, setMessage] = useState('');
    const [repMessage, setRepMessage] = useState('');
    
    const [ItemContainer,setItemContainer] = useState<ContainerData[]>([]);

    const [CurEditItem,setCurEditItem] = React.useState('');

    const ucfCoords:LatLng = new LatLng(28.6024, -81.2001);
    const [position, setPosition] = useState(ucfCoords);

    //SearchBar
    const [status,setstatus] = React.useState('');
    const [Category,setCategory] = React.useState('');
    const [Search,setSearchItem] = React.useState('');

    //View
    const [VitemTitle, setItemNameValueV] = React.useState('');
    const [VitemDesc, setItemDescValueV] = React.useState('');
    const [VitemCat, setItemCatValueV] = React.useState('');
    const [VitemImage, setItemImageValueV] = React.useState('');
    const [viewPosition, setItemPositionValueV] = React.useState(ucfCoords);


    //Edit
    const [EitemTitle, setItemNameValueE] = React.useState('');
    const [EitemDesc, setItemDescValueE] = React.useState('');
    const [EitemCat, setItemCatValueE] = React.useState('');
    const [EitemImage, setItemImageValueE] = React.useState('');


    //Add
    const [itemTitle, setItemNameValue] = React.useState('');
    const [itemDesc, setItemDescValue] = React.useState('');
    const [itemCat, setItemCatValue] = React.useState('');
    const [itemImage, setItemImageValue] = React.useState('');
    const [itemLocation, setLocationValue] = React.useState('');
    const [itemUSERID, setItemUSERIDValue] = React.useState('');

     async function AddItemPage(e : any): Promise<void>{
         e.preventDefault();

        if (AddPopupRef.current){
            AddPopupRef.current.style.visibility = 'visible';
        }
    }


    async function ItemPage(Item: any): Promise<void>{

        console.log(Item.location.coordinates[0], Item.location.coordinates[1]);

        if (ViewPopupRef.current){
            setItemNameValueV(Item.title);
            setItemPositionValueV(new LatLng(Item.location.coordinates[1], Item.location.coordinates[0]));
            setItemDescValueV(Item.description);
            setItemCatValueV(Item.category);
            setItemImageValueV(Item.imageUrl);
            
            ViewPopupRef.current.style.visibility = 'visible';

            if (imageViewRef.current)
            {
                if(Item.imageUrl == "")
                imageViewRef.current.style.display = 'none';
                else
                    imageViewRef.current.style.display = 'flex';
            }
        }
    }

    async function EditPage(Item: any): Promise<void>{
        if (EditPopupRef.current){
            setCurEditItem(Item._id);
            setItemNameValueE(Item.title);
            setItemDescValueE(Item.description);
            setItemCatValueE(Item.category);
            setItemImageValueE(Item.imageUrl);
            setPosition(new LatLng(Item.location.coordinates[1], Item.location.coordinates[0]));
            EditPopupRef.current.style.visibility = 'visible';
        }
    }

    async function exitReport(){
        if (AddPopupRef.current){
            AddPopupRef.current.style.visibility = 'hidden';
            resetFields();
        }
    }

    async function exitReportEdit(){
        if (EditPopupRef.current){
            EditPopupRef.current.style.visibility = 'hidden';
            resetFields();
        }
    }

    async function ViewexitReport(){
        if (ViewPopupRef.current){
            ViewPopupRef.current.style.visibility = 'hidden';
            resetFields();
        }
    }

    async function resetFields() 
    {
        setItemNameValue('');
        setItemDescValue('');
        setItemCatValue('');
        setItemImageValue('');
        setLocationValue('');
        setRepMessage('');
        setPosition(ucfCoords);
        searchItem(itemUSERID);
    }


    async function EditItem(){

        
        
        let obj = { title: EitemTitle,description: EitemDesc,category: EitemCat,imageUrl: EitemImage, 
            location: {type: "Point", coordinates: [position.lng, position.lat]}, userId: itemUSERID };
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
                exitReportEdit();
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
                setItemContainer(ItemContainer.filter((ItemContainer) => ItemContainer._id !== itemId));
                
                if(ItemContainer.length === 0){
                    NoItemPage.current.style.display = 'flex'
                    LostItemPage.current.style.display = 'none'
                }
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
                exitReport();      
                LostItemPage.current.style.display = 'flex'
            }
        }
        catch (error: any) {
            setRepMessage(error.toString());
        }
    };

    async function searchItem(id: any){

        try {
            const response = await fetch(buildAPIPath(`api/users/${id}/items`),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setItemContainer(res.results);
            if(res.count == 0){
                NoItemPage.current.style.display = 'flex'
                LostItemPage.current.style.display = 'none'
            }
            else{
                NoItemPage.current.style.display = 'none'
                LostItemPage.current.style.display = 'flex'
            }
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
    };

    async function searchItemSpecific(e: any): Promise<void>{
         e.preventDefault();

        setItemContainer([])

        try {
            const response = await fetch(buildAPIPath(`api/items?status=${status}&category=${Category}&search=${Search}&userId=${itemUSERID}`),
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


    //Grab userid
    useEffect(() => {
        const Data = sessionStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            
            searchItem(UserData?.userId);

                /*
            let txt = await response.text();
            let res = JSON.parse(txt);
            setItemContainer(res.results);*/
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
                        ? `Marker is draggable! ${position}`
                        : 'Click here to make marker draggable.'}
                    </span>
                </Popup>
            </Marker>
        )
    }

function ChangeView({center, zoom }: any) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
  return null;
}

    return (
        <div id="MainUIDiv">

            <h1 id = "homeHeader" className = "inner-title">Item Reports</h1>

            <div id = "LostItemPage" ref = {LostItemPage}>
                {ItemContainer.map(ItemContainer => (
                    <div key = {ItemContainer._id} className = "ItemContainers">
                        <input type = "text" id = "ContainerTitle" className = "containerInput" value = {ItemContainer.title} readOnly/>
                        <input type = "text" id = "ContainerStatus" className = "containerInput" value = {ItemContainer.status} readOnly/>
                        <button type = "button" id = "ContainerData" className = "containerBtn" onClick = {() => {ItemPage(ItemContainer)}}>View Report</button>
                        <button type = "button" id = "ContainerEdit" className = "containerBtn" onClick = {() => EditPage(ItemContainer)}>Edit</button>
                        <button type = "button" id = "ContainerDelete" className = "containerBtn" onClick = {() => DeleteItem(ItemContainer._id)}>Delete</button>
                    </div>
                ))}
                
            </div>
            <div id = "NoItemPage" ref ={NoItemPage}>
                <span>No items!</span>
            </div>

            <div id = "SearchBar">
                <select id = 'statusFilter' className = "filter" onChange = {handleStatusChange}>
                    <option className = "default" value = "">Filter By Status...</option>
                    <option value = "lost">Lost</option>
                    <option value = "found">Found</option>
                </select>
                <select id = 'categoryFilter' className = "filter" onChange = {handleCategoryChange}>
                    <option className = "default" value = "">Filter By Category...</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparel">Apparel</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                    <option value = "Other">Other</option>
                </select>
                <input type = "text" id = "Searchtab" placeholder = "Item Name..." onChange = {handleSearchItemChange}/>
                <button type = "button" id = "SearchItem" className ="button" onClick = {searchItemSpecific}>Search</button>
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

                <select id = 'category' className = "filter" value = {itemCat} onChange = {handleItemCatChange}>
                    <option value = "">Select Option...</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparel">Apparel</option>
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
                    <ChangeView center = {position} zoom = {17}/>
                </MapContainer>

                <input type="text" id="itemTitle" value= {EitemTitle} placeholder="Item Name"
                    onChange={EdithandleItemTextChange} />

                <textarea 
                    id="Desc" 
                    value = {EitemDesc}
                    placeholder="Item Description"
                    onChange={EdithandleDescTextChange}>
                </textarea>

                <select id = 'category' className = "filter" value = {EitemCat} onChange = {EdithandleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparel">Apparel</option>
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
                <h2 id = 'reportHeader'>Item Report: {VitemTitle}</h2>

                <span id="itemAddResult">{repMessage}</span>

                <div id = "imgContainer" ref = {imageViewRef}>
                    <img id = "reportImg" src = {VitemImage}/>
                </div>

                <MapContainer id = "map" center = {ucfCoords} zoom={17} scrollWheelZoom={false} placeholder>
                    <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position = {viewPosition}
                    icon = {new Icon ((
                    {
                         iconUrl: markerIconPng, 
                        iconSize: [25, 41], 
                    }))}/>
                    <ChangeView center = {viewPosition}/>
                </MapContainer>



                <label id = "viewLabel" htmlFor = "Desc">Description</label>                
                <textarea 
                    id="viewDesc" 
                    value = {VitemDesc}
                    readOnly>
                </textarea>

                <label id = "viewLabel" htmlFor = "CategoryView">Category</label>
                <input type = "text" id = "CategoryView" className = "filter" value = {VitemCat} readOnly/>
                
            </div>

            <br />
                <span id="itemAddResult">{message}</span>
            <br />

           <div id = "ButtonHolster">
                <input type="button" id="addItemButton" className="button"
                    onClick={AddItemPage} value = "Make a Report"/>
           </div>
            
        </div>

    );
}

export default CardUI;
