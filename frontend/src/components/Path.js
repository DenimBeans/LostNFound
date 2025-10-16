const app_name = '174.138.65.216'
exports.buildPath = 
    function buildPath(route)
    {
        if (process.env.NODE_ENV != 'development') 
        {
            return 'http://' + app_name + ':5000/' + route;
        }
        else
        {        
            return 'http://localhost:5000/' + route;
        }
    }
