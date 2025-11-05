import React, { useState } from 'react';
import { buildPath } from './Path';
import {useEffect} from 'react';
import {useRef} from 'react';
import '../Styles/MainPage.css';


//CHANGE AS NEEDED. Taken from MERN App, retooled for testing purposes.

function CardUI() {
    const AddPopupRef = useRef<HTMLDivElement>(null);

    interface ContainerData{
        _id : string;
        title : string;
        description : string;
        category : string;
        status : string;
    }

    const [message, setMessage] = useState('');
    //const [searchResults, setResults] = useState('');
    //const [itemList, setItemList] = useState('');
    
    const [ItemContainer,setItemContainer] = useState<ContainerData[]>([]);

    const [itemTitle, setItemNameValue] = React.useState('');
    const [itemDesc, setItemDescValue] = React.useState('');
    const [itemCat, setItemCatValue] = React.useState('');
    const [itemImage, setItemImageValue] = React.useState('');
    const [itemLat, setItemLatValue] = React.useState('');
    const [itemLong, setItemLongValue] = React.useState('');
    const [itemLocation, setLocationValue] = React.useState('');
    const [itemDate, setItemDateValue] = React.useState('');
    const [itemUSERID, setItemUSERIDValue] = React.useState('');
    const [ownerName, setNameValue] = React.useState('');
    const [ownerEmail, setEmailValue] = React.useState('');

    async function ItemPage(){
        if (AddPopupRef.current){
            AddPopupRef.current.style.display = 'flex';
        }
    }

    async function ItemData(){

    }

    async function EditItem(){

    }

    async function DeleteItem(itemId : String): Promise<void>{
        let obj = {id: itemId}
        let js = JSON.stringify(obj)

        try {
            const response = await fetch(buildPath('api/items/:id'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });
            
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

        let obj = { title: itemTitle,description: itemDesc,category: itemCat,imageUrl: itemImage,lat: itemLat,lng: itemLong, locationText: itemLocation,lostAt: itemDate,userId: itemUSERID, reporterName: ownerName, reporterEmail: ownerEmail };
        let js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/items'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error != '') {
                setMessage(res.error)
            }
            else {
                if (AddPopupRef.current){
                    AddPopupRef.current.style.display = 'none';
                }
                setItemNameValue('');
                setItemDescValue('');
                setItemCatValue('');
                setItemImageValue('');
                setItemLatValue('');
                setItemLongValue('');
                setLocationValue('');
                setItemDateValue('');
                setNameValue('');
                setEmailValue('');
            }
        }
        catch (error: any) {
            setMessage(error.toString());
        }
    };

    async function searchItem(e: any): Promise<void> {
        e.preventDefault();

        //let obj = {id:search};
        //let js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/items:id'),
                { method: 'GET', headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            setItemContainer(res.results)
            }
            
        
        catch (error: any) {
            console.log("Frontend Error");
        }
    };

    /*
        function handleSearchTextChange( e: any ) : void
        {
            setSearchValue( e.target.value );
        }
    */

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
        setItemImageValue(e.target.files[0]);
    }
    function handleItemLatChange(e: any): void {
        setItemLatValue(e.target.value);
    }
    function handleItemLongChange(e: any): void {
        setItemLongValue(e.target.value);
    }

    function handleLocationTextChange(e: any): void {
        setLocationValue(e.target.value);
    }

     function handleItemDateChange(e: any): void {
        setItemDateValue(e.target.value);
    }
    //Grab userid
    useEffect(() => {
        const Data = localStorage.getItem('user_data');
        if(Data != null){
            const UserData = JSON.parse(Data);
            setItemUSERIDValue(UserData?.userId);
        }
        else{
            setItemUSERIDValue('');
        }
    },[]);
    
  

    function handleNameTextChange(e: any): void {
        setNameValue(e.target.value);
    }

    function handleEmailTextChange(e: any): void {
        setEmailValue(e.target.value);
    }

    return (
        <div id="MainUIDiv">
            <div id = "LostItemPage">
                {ItemContainer.map(ItemContainer => (
                    <div key = {ItemContainer._id} className = "ItemContainers">
                        <input type = "text" id = "ContainerTitle" value = {ItemContainer.title} readOnly/>
                        <button type = "button" id = "ContainerData" onClick = {ItemData}>Info</button>
                        <button type = "button" id = "ContainerEdit" onClick = {EditItem}>Edit</button>
                        <button type = "button" id = "ContainerDelete" onClick = {(e:any) => DeleteItem(ItemContainer._id)}>Delete</button>
                        <input type = "text" id = "ContainerStatus" value = {ItemContainer.status} readOnly/>
                    </div>
                ))}
                
            </div>
            <div id = "AddItemPopup" ref = {AddPopupRef}>

                <input type="text" id="title" placeholder="Item"
                    onChange={handleItemTextChange} />

                <textarea id="Desc" placeholder="Item"
                    onChange={handleDescTextChange}></textarea>

                <select value = {itemCat} onChange = {handleItemCatChange}>
                    <option value = " ">Select Option</option>
                    <option value = "Electronic">Electronic</option>
                    <option value = "Apparal">Apparal</option>
                    <option value = "Container">Container</option>
                    <option value = "Personal">Personal</option>
                </select>

                <input type="file" id = "ImageUp" accept = "image/*" onChange = {handleItemImageChange}></input>

                <input type = "text" id = "lat" placeholder ="lat" onChange = {handleItemLatChange}></input>

                <input type = "text" id = "long" placeholder ="long" onChange = {handleItemLongChange}></input>

                <input type="text" id="locationText" placeholder="Location"
                    onChange={handleLocationTextChange} />
                
                <input type="date" id="time" placeholder="date"
                    onChange={handleItemDateChange} />

                <input type="text" id="name" placeholder="First Name"
                    onChange={handleNameTextChange} />

                <input type="text" id="email" placeholder="Email"
                    onChange={handleEmailTextChange} />


                <button type = "button" id="SubmitItemButton" className = "buttons"
                    onClick={addItem}>Submit</button>
                
            </div>
           <div id = "ButtonHolster">
                <button type="button" id="addItemButton" className="buttons"
                    onClick={ItemPage}> Add Item </button>
                    <br />
                        <span id="itemAddResult">{message}</span>
                    <br />
                <button type="button" id="searchItemButton" className="buttons"
                    onClick={searchItem}>Display All Items</button><br />
           </div>
            
        </div>

    );
}

export default CardUI;
