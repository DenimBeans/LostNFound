const MongoClient = require('mongodb').MongoClient;

require('dotenv').config();
const url = process.env.MONGODB_URI;

const client = new MongoClient(url);
client.connect();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => 
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});

app.listen(5000); // start Node + Express server on port 5000

/*CHANGE API CODE/LOCATION AS NEEDED. 
  The format is taken from Leinecker's MERN Stack App and roughly follows Rian's 
  database format. - Jean */

app.post('/api/addItem', async (req, res, next) =>
{
  // incoming: userId, color
  // outgoing: error
	
  const {title, locationText, reporterName, reporterEmail} = req.body;

  const newItem = {title:title, locationText:locationText, status:"Lost", 
    reporterName:reporterName, reporterEmail:reporterEmail};
  var error = '';

  try
  {
    const db = client.db('lost_found_db');
    const result = db.collection('items').insertOne(newItem);
  }
  catch(e)
  {
    error = e.toString();
  }

  var ret = { error: error };
  res.status(200).json(ret);
});


app.post('/api/login', async (req, res, next) => 
{
  // incoming: login, password
  // outgoing: id, firstName, lastName, error
	
 var error = '';

  const { login, password } = req.body;

  const db = client.db('lost_found_db');
  const results = await db.collection('users').find({Login:login,Password:password}).toArray();

  var id = -1;
  var fn = '';
  var ln = '';

  if( results.length > 0 )
  {
    id = results[0].UserID;
    fn = results[0].FirstName;
    ln = results[0].LastName;
  }

  var ret = { id:id, firstName:fn, lastName:ln, error:''};
  res.status(200).json(ret);
});


app.post('/api/searchItems', async (req, res, next) => 
{
  // incoming: userId, search
  // outgoing: results[], error

  var error = '';

  const { search } = req.body;

  var _search = search.trim();
  
  const db = client.db('lost_found_db');
  const results = await db.collection('items').find({"title":{$regex:_search+'.*', $options:'i'}}).toArray();
  
  var _ret = [];
  for( var i=0; i<results.length; i++ )
  {
    _ret.push( results[i].title );
  }
  
  var ret = {results:_ret, error:error};
  res.status(200).json(ret);
});