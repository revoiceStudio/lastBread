
exports.betting_delayElapsed = function(req, res){
    const jsonObj = req.body
    console.log("요청이 왔습니다. : \n",jsonObj)
    console.log("audioplayer 정보 : \n",jsonObj["context"].supportedInterfaces.AudioPlayer)
    const parameters = jsonObj.action.parameters
    const url = JSON.parse(process.env.URL).bet
    const token = JSON.parse(process.env.TOKEN).bet
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    
    const bet = parameters['betMoney'].value
    responseObj.output["betM"] = bet

    directives.audioItem.stream["offsetInMilliseconds"] = 20000
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    directives.type="AudioPlayer.Stop"
    directives.stream = {}
    responseObj.directives[0] = directives
 

    console.log("응답 보냅니다. : \n",responseObj)
    console.log("audioplayer 정보 : \n",responseObj.directives[0])
    return res.json(responseObj)
}