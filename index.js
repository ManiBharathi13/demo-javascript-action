const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');

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
   const pollInterval =  setInterval(()=>{
        const req = https.request(options, res => {
        console.log(`Poll ${++pollCount} - statusCode: ${res.statusCode}`);  
        });
        req.on('error', error => {
            console.error(error);
          });
        if((new Date() - startTime)/ 1000 >= 60)
        {
            const response = "Success"
            core.setOutput("response", response)
            clearInterval(pollInterval)
            console.log("Polling Complete")
        }
    },5000)
}
catch(err)
{
    console.log(err)
    core.setFailed(err.message);
    core.setOutput("response", "Failure")
}