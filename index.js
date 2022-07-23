const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');
const axios = require('axios');

try{
    const name = core.getInput('name')
    console.log(`Hello ${name}`)
    console.log('Polling every 5s for 1 minute')
    const options = {
        hostname: 'fantasy.premierleague.com',
        port: 443,
        path: '/api/bootstrap-static/',
        method: 'GET',
      };
    let startTime = new Date()
    console.log("Polling Start Time : "+  startTime.toGMTString())
    let pollCount =0 
   const pollInterval =  setInterval(function(){
        pollCount++
        
        axios
        .get('https://fantasy.premierleague.com/api/bootstrap-static/')
        .then(res => {
          console.log(`Poll ${pollCount} - statusCode: ${res.status}`);
          
        })
        .catch(error => {
          console.error(error);
        });
        if((new Date() - startTime)/ 1000 >= 60)
        {
            const response = "Success"
           core.setOutput("response", response)
            clearInterval(pollInterval)
            console.log("Polling Complete")
            process.exit()
        }
    },5000)

   
}
catch(err)
{
    console.log(err)
    core.setFailed(err.message);
    core.setOutput("response", "Failure")
    process.exit()
}