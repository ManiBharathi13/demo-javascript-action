const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const domain = "https://botzautomationstaging.rapidbotz.com"
let token
let botzProjectId
let botzAccountId
try{

   const username = core.getInput('username') 
   const secret = core.getInput('secret')
   const onDemandScheduleName = core.getInput('onDemandScheduleName')
    
    // const username = 'mani.s'
    // const secret = 'BZST::mani.s::jjmioj8504pdpmmocapg5r7nrs'
    // const onDemandScheduleName = 'TestSchedule'
    botzProjectId = core.getInput('botzProjectId')
    botzAccountId = core.getInput('botzAccountId')
    const interval = (core.getInput('interval') && core.getInput('interval') != '' && typeof core.getInput('interval') === 'number' ) ? core.getInput('interval') : 5
    const timeout = (core.getInput('timeout') && core.getInput('timeout') != '' && typeof core.getInput('timeout') === 'number' ) ? core.getInput('timeout') : 3600
    
    if(validateInputs(username, secret, onDemandScheduleName))
    {
      let loginReq = login(username , secret)
      loginReq.then(function (response) {
        let loginRes = response.data

        if(loginRes && loginRes.status === 'Success')
        {
          token =  loginRes.token
          let onDemandScheduleExecuteReq = executeOnDemandSchedule(onDemandScheduleName)
          onDemandScheduleExecuteReq.then(function(onDemandScheduleExecuteResponse){
            let onDemandScheduleExecuteRes = onDemandScheduleExecuteResponse.data
           
            if(onDemandScheduleExecuteRes && onDemandScheduleExecuteRes.status === 'Success')
            {
              
              let executionGroupId = onDemandScheduleExecuteRes.rootEntity.id
              
              let executionGroupStatus = pollExecutionGroup(executionGroupId,timeout,interval)
              if(executionGroupStatus && executionGroupStatus.status === 'Success')
              {
                core.setOutput("status", "Success")
              }
              else if(executionGroupStatus && executionGroupStatus.status === 'Failure')
              {
                
                core.setOutput("status", "Failure")
                core.setOutput("errorMessages" ,executionGroupStatus.errorMessages)
              }

            }
            else if((onDemandScheduleExecuteRes && onDemandScheduleExecuteRes.status === 'Failure'))
            {
              core.setOutput("status", "Failure")
              core.setOutput("errorMessages" ,onDemandScheduleExecuteRes.errorMessages)
            }
          })
          .catch(function(error){
           
            core.setOutput("status", "Failure")
            core.setOutput("errorMessages" , [error.message])
          })

        }
        else if(loginRes && loginRes.status === 'Failure')
        {
          core.setOutput("status", "Failure")
          core.setOutput("errorMessages" ,loginRes.errorMessages)
        }
        else if(loginRes && loginRes.status === 'AuthenticationFailure')
        {
          core.setOutput("status", "Failure")
          core.setOutput("errorMessages" , ["Authentication Failure"])
        }
      })
      .catch(function (error) {
       
        core.setOutput("status", "Failure")
        core.setOutput("errorMessages" , [error.message])
      });
     
    }
    else
    {
      core.setOutput("status", "Failure")
      let errorMessages = ["One or more mandatory input(s) is missing"]
      core.setOutput("errorMessages" , errorMessages)
  
    }
   
   
}
catch(err)
{
    
    core.setFailed(err.message);
    core.setOutput("status", "Failure")
    core.setOutput("errorMessages", [err.message])

}

function validateInputs(username,secret,onDemandScheduleName)
{
  
  if(username && secret && onDemandScheduleName && botzProjectId && botzAccountId)
  {
    return true
  }
  else{
    return false
  }
}

function login(username, secret)
{
  let data = JSON.stringify({
    "serviceRequest": {
      "rootEntity": {
        "expanded": false,
        "active": true,
        "type": "user",
        "userName": username,
        "password": secret
      }
    }
  });

  let config = {
    method: 'post',
    url: domain+'/user/login',
    headers: { 
      'Content-Type': 'application/json'
    },
    data : data
  };
  return axios(config)

}

function executeOnDemandSchedule(onDemandScheduleName)
{
  let data = JSON.stringify({
    "serviceRequest": {
      "rootEntity": {
        "type": "onDemandExecutionRequest",
        "name": onDemandScheduleName
      }
    }
  });

  let config = {
    method: 'put',
    url: domain+'/rest/entity',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization' : `Bearer ${token}`,
      'botzprojectid': '6', 
      'botzaccountid': '2'
    },
    data : data
  };
  return axios(config)
}

function pollExecutionGroup(executionGroupId, timeout , interval)
{
  console.log('Execution Group ' + executionGroupId + ' has been created')
  let config = {
    method: 'get',
    url: domain+'/rest/entity/ExecutionGroup/'+executionGroupId+'/dto',
    headers: { 
      'Authorization' : `Bearer ${token}`,
      'botzprojectid': '6', 
      'botzaccountid': '2'
    }
  };
  let startTime = new Date()
  let polling = setInterval(()=>{
    axios(config).then(function(response)
    {
      let res= response.data
      if(res && res.status === 'Success')
      {
        let status = res.rootEntity.status
        console.log('Execution Group Status :: ' + res.rootEntity.status)
        if(status === 'Pass')
        {
          clearInterval(polling)
          return {status:"Success" }
        }
        else if(status === 'Fail')
        {
          clearInterval(polling)
          return {status:"Failure" , errorMessages:["Execution Failure"] }
        }
      }
      else if(res && res.status === 'Failure')
      {
        console.log(res)
        
      }
    })
    .catch(function (error) {
      console.log(error)
      
    });
    
    if((new Date() - startTime)/ 1000 >= timeout)
    {
        clearInterval(polling)
        return {status:"Failure" , errorMessages:["Session Timed out"]}
        
    }
  }, interval * 1000)
}

// getExecutionGroup(executionGroupId)
// {
  
//   return 
// }