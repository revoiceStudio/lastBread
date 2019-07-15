const logger = require('../log')
exports.ad_start = function (req, res){

    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    
    const url = JSON.parse(process.env.URL).gan
    const token = JSON.parse(process.env.TOKEN).ad
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]

    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives

    logger.log("응답\n")
    return res.json(responseObj)      
}

exports.matching_start = async function (req, res){

    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    const parameters = jsonObj.action.parameters
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    const ticketNum = register.ticket

    logger.log("티켓 갯수 : "+ticketNum)
    logger.log("파라미터:"+parameters)
    /*
    if(typeof parameters['ad_inform'] !== 'undefined'){
        if(parameters['ad_inform'].value == 1){
            const url = JSON.parse(process.env.URL).gan
            const token = JSON.parse(process.env.TOKEN).ad
            directives.audioItem.stream["url"] = url
            directives.audioItem.stream["token"] = token
            responseObj.output["matching_ment"] = "잘 들어보세요~"
            responseObj.directives[0] = directives
            logger.log("응답\n")
            return res.json(responseObj)   
        }
    }*/
    if(ticketNum==0){
        logger.log("티켓이 없습니다. (광고를 들어달라고 프롬포트가 나감.)")
        const responObj = JSON.parse(process.env.RESPONSE)
        responObj["resultCode"] = JSON.parse(process.env.EXCEPTION).ticket
        responObj["directives"] = []
        return res.json(responObj)
    }
    else{

        let message = globalData
        logger.log("받은거:::"+message)
        //키값 생성 & 공유
        if(message.count==0){
            let key = await fb.push().key
            message["roomKey"] = key  
            await process.send(message)
            logger.log("요청끝"+globalData)
        }
        /*if(globalData.count==0){
            globalData.roomKey = await fb.push().key
        }*/
        const roomKey = message.roomKey
        logger.log('랜덤키값 생성 :'+ roomKey)
        //logger.log('랜덤키값 생성 :', globalData.roomKey)
        message["count"] =  ++message["count"]
        await process.send(message)
        // 게임 룸 생성
        //globalData.count = ++globalData.count
        //firebaseUser.createRoom(res["userInfo"].id, globalData.roomKey)
        firebaseUser.createRoom(res["userInfo"].id, roomKey)
        // 플레이어 수 갱신
        //firebaseUser.setMatchingPlayerNum(globalData.roomKey,globalData.count)
        //firebaseUser.setMatchingPlayerNum(roomKey ,message.count)
        
        logger.log("현재 플레이 요청 유저: "+res["userInfo"].id)
        logger.log("전체 플레이 요청 유저 총, "+globalData.count+"명")

        if(globalData.count==4){
            //globalData.count = 0
            message.count=0
            await process.send(message)
        }

        const url = JSON.parse(process.env.URL).matching
        const token = JSON.parse(process.env.TOKEN).matching        

        // 매칭된 첫 번째 유저인 경우
        if(globalData.count==1){
            firebaseUser.setFirstTime(globalData.roomKey)
        }
        else{
            const offset = await firebaseUser.setMatchingOffset(globalData.roomKey)
            directives.audioItem.stream["offsetInMilliseconds"] = offset
        }
        directives.audioItem.stream["url"] = url
        directives.audioItem.stream["token"] = token
        responseObj.output["matching_ment"] = "매칭을 시작합니다."
        responseObj.directives[0] = directives
        logger.log("응답\n")
        return res.json(responseObj)
    }
}