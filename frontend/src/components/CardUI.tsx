import React, { useState, useMemo, useCallback } from 'react';
import { buildAPIPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';
import '../Styles/MainPage.css';
import '../Styles/FrontPage.css';

//Map imports - Jean
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {LatLng} from 'leaflet';
import 'leaflet/dist/leaflet.css';


function CardUI() {
    const AddPopupRef = useRef<HTMLDivElement>(null);
    const EditPopupRef = useRef<HTMLDivElement>(null);


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

    //SearchBar
    const [status,setstatus] = React.useState('');
    const [Category,setCategory] = React.useState('');
    const [Search,setSearchItem] = React.useState('');

    const [itemTitle, setItemNameValue] = React.useState('');
    const [itemDesc, setItemDescValue] = React.useState('');
    const [itemCat, setItemCatValue] = React.useState('');
    const [itemImage, setItemImageValue] = React.useState('');
    const [itemLocation, setLocationValue] = React.useState('');
    const [itemUSERID, setItemUSERIDValue] = React.useState('');

    const ucfCoords:LatLng = new LatLng(28.6024, -81.2001);
    const [position, setPosition] = useState(ucfCoords);



    async function ItemPage(){
        if (AddPopupRef.current){
            AddPopupRef.current.style.visibility = 'visible';
        }
    }

    async function EditPage(Item: any): Promise<void>{
        if (EditPopupRef.current){
            setCurEditItem(Item._id);
            setItemNameValue(Item.title);
            setItemDescValue(Item.description);
            setItemCatValue(Item.category);
            setItemImageValue(Item.imageUrl);
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


    async function EditItem(){

        
        
        let obj = { title: itemTitle,description: itemDesc,category: itemCat,imageUrl: itemImage,lat: position.lat,
            lng: position.lng, locationText: itemLocation,userId: itemUSERID };
        let js = JSON.stringify(obj);

         try {
            const response = await fetch(buildAPIPath(`api/items/${CurEditItem}`),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

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

    //Grab userid
    useEffect(() => {
        const Data = localStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
            searchItem(true);
        }
        else{
            setItemUSERIDValue('');
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
            ref={markerRef}>
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
                        <button type = "button" id = "ContainerData" onClick = {() => ItemPage()}>Info</button>
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

                <input type="text" id="itemTitle" placeholder="Item Name"
                    onChange={handleItemTextChange} />

                <textarea 
                    id="Desc" 
                    placeholder="Item Description"
                    onChange={handleDescTextChange}>
                </textarea>

                <input type="text" id = "locationText" placeholder = "Building Name/Classroom Number/Floor" 
                    onChange = {handleLocationTextChange}></input>

                <select id = 'category' value = {itemCat} onChange = {handleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>

                <input type="text" id = "ImageUp" placeholder = "Image URL" 
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

                <input type="text" id="itemTitle" placeholder="Item Name"
                    onChange={handleItemTextChange} />

                <textarea 
                    id="Desc" 
                    placeholder="Item Description"
                    onChange={handleDescTextChange}>
                </textarea>

                <input type="text" id = "locationText" placeholder = "Building Name/Classroom Number/Floor" 
                    onChange = {handleLocationTextChange}></input>

                <select id = 'category' value = {itemCat} onChange = {handleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>

                <input type="text" id = "ImageUp" placeholder = "Image URL" 
                    onChange = {handleItemImageChange}></input>

                <input type = "button" id="reportButton" className = "button"
                    onClick={EditItem} value = "Submit"/>
                
            </div>

           <div id = "ButtonHolster">
                <input type="button" id="addItemButton" className="button"
                    onClick={ItemPage} value = "Add Item"></input>

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
