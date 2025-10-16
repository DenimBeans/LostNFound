import React, { useState } from 'react';

//CHANGE AS NEEDED. Taken from MERN App, retooled for testing purposes.

function CardUI()
{
    //let _ud : any = localStorage.getItem('user_data');
    //let ud = JSON.parse( _ud );
    //let userId : string = ud.id;
    const [message,setMessage] = useState('');
    const [searchResults,setResults] = useState('');
    const [itemList,setItemList] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [itemTitle,setItemNameValue] = React.useState('');
    const [itemLocation,setLocationValue] = React.useState('');
    const [ownerName,setNameValue] = React.useState('');
    const [ownerEmail,setEmailValue] = React.useState('');

    const app_name = '174.138.65.216';
    function buildPath(route:string) : string
    {
        if (import.meta.env.MODE != 'development') 
        {
            return 'http://' + app_name + ':5000/' + route;
        }
        else
        {        
            return 'http://localhost:5000/' + route;
        }
    }

    
    async function addItem(e:any) : Promise<void>
    {
        e.preventDefault();

        let obj = {title:itemTitle,locationText:itemLocation,reporterName:ownerName,reporterEmail:ownerEmail};
        let js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/addItem'),
                {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Item has been added');
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    async function searchItem(e:any) : Promise<void>
    {
        e.preventDefault();
        
        let obj = {search:search};
        let js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/searchItems'),
                {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);
            let _results = res.results;
            let resultText = '';
            for( let i=0; i<_results.length; i++ )
            {
                resultText += _results[i];
                if( i < _results.length - 1 )
                {
                    resultText += ', ';
                }
            }
            setResults('Item(s) have been retrieved');
            setItemList(resultText);
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
    };

    function handleSearchTextChange( e: any ) : void
    {
        setSearchValue( e.target.value );
    }

    function handleItemTextChange( e: any ) : void
    {
        setItemNameValue( e.target.value );
    }

    function handleLocationTextChange( e: any ) : void
    {
        setLocationValue( e.target.value );
    }

    function handleNameTextChange( e: any ) : void
    {
        setNameValue( e.target.value );
    }

     function handleEmailTextChange( e: any ) : void
    {
        setEmailValue( e.target.value );
    }

    return(
        <div id="cardUIDiv">
            <br />
            Search: <input type="text" id="searchText" placeholder="Card To Search For" 
                onChange={handleSearchTextChange} />
            <button type="button" id="searchItemButton" className="buttons" 
                onClick={searchItem}> Search Item</button><br />
            <span id="cardSearchResult">{searchResults}</span>
            <p id="cardList">{itemList}</p><br /><br />
            Add: <input type="text" id="title" placeholder="Item" 
                onChange={handleItemTextChange} />
                <input type="text" id="locationText" placeholder="Location" 
                onChange={handleLocationTextChange} />
                <input type="text" id="name" placeholder="First Name" 
                onChange={handleNameTextChange} />
                <input type="text" id="email" placeholder="Email" 
                onChange={handleEmailTextChange} />
            <button type="button" id="addItemButton" className="buttons" 
                onClick={addItem}> Add Item </button><br />
            <span id="itemAddResult">{message}</span>
        </div>

    );
}

export default CardUI;
