const logger = require('../log')
//매칭이 끝나면, 해당 방의 플레이어 수를 체크하여 부족한 플레이어 수만큼 AI 생성.
exports.matching_finished = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")

    const roomKey = globalData["roomKey"]

    // 실제 플레이어 수
    const matchingPlayerNum = await firebaseUser.checkRoom(roomKey)
    //카운트 초기화
    globalData["count"] = 0
    await process.send(globalData)
    //AI생성
    if(matchingPlayerNum==2){
        firebaseUser.addAI("A", roomKey)
        firebaseUser.addAI("B", roomKey)
        firebaseUser.addAI("C", roomKey)
    }
    if(matchingPlayerNum==3){
        firebaseUser.addAI("B", roomKey)
        firebaseUser.addAI("C", roomKey)
    }
    if(matchingPlayerNum==4){
        firebaseUser.addAI("C", roomKey)
    }

    // 티켓 -1 
    //const ticket = --register["ticket"]
    //firebaseUser.minusTicket(res["userInfo"].id, ticket )
    //const ticket = await firebaseUser.ticketNum(res["userInfo"].id)
    const url = JSON.parse(process.env.URL).intro_mise
    const token = JSON.parse(process.env.TOKEN).intro
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    //responseObj.output["player_ticket"] = ticket
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives

    logger.log("응답\n")
    return res.json(responseObj)
}
exports.intro_finished = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")

    const url = JSON.parse(process.env.URL).ready_bet
    const token = JSON.parse(process.env.TOKEN).ready_bet
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]

    //몇번 플레이어인지 가져온다.
    const playNumber = await firebaseUser.playerNum(res["userInfo"].id, register["room"])
    responseObj.output["playerNum"] = playNumber
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives
    
    logger.log("응답\n")
    return res.json(responseObj)
}
exports.betting_start = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    const parameters = jsonObj.action.parameters
    const url = JSON.parse(process.env.URL).bet
    const token = JSON.parse(process.env.TOKEN).bet
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]
    let bet = parameters['input_bet'].value

    if(bet==1){bet=10000}
    if(bet==2){bet=20000}
    if(bet==3){bet=30000}
    if(bet==4){bet=40000}
    if(bet==5){bet=50000}
    if(bet==6){bet=60000}
    if(bet==7){bet=70000}
    if(bet==8){bet=80000}
    if(bet==9){bet=90000}
    if(bet==10){bet=100000}
    const money = await firebaseUser.nowMoney(res["userInfo"].id)

    //잘못된 요청인 경우
    // 1. 한번도 플레이하지 않은 경우
    if(!money && money!=0) {
        logger.log("잘못된 요청, 한번도 플레이하지 않고 배팅요청한 경우\n")
        responseObj["resultCode"] = JSON.parse(process.env.EXCEPTION).bet
        responseObj["directives"] = []
        return res.json(responseObj)
    }
    // 2. AI 만들어지기 전에 방을 나간경우
    // 배팅가격 DB에 추가, 남은 돈 계산
    const cal = await firebaseUser.addBet(res["userInfo"].id, bet)
    console.log("cal 요놈 ::: "+cal)
    if(!cal) {
        logger.log("잘못된 요청, 매칭 중간에 AI 생기기 전에 나가고 배팅 요청한 경우\n")
        responseObj["resultCode"] = JSON.parse(process.env.EXCEPTION).bet
        responseObj["directives"] = []
        return res.json(responseObj)
    }

    // 배팅 offset 맞춘다.
    const offset = await firebaseUser.setBettingOffset()

    if(money<bet)(bet = money)
    responseObj.output["player_bet"] = bet
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    directives.audioItem.stream["offsetInMilliseconds"] = offset
    responseObj.directives[0] = directives

    logger.log("응답\n")
    return res.json(responseObj)
}
exports.bet_finished = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    
    // 남은 bread 개수에 맞추어 음악을 전송한다.
    let url = ""
    // 살아있는데 배팅 안한 얘들 die 처리한다.
    await firebaseUser.liveButNotBeted()
    // 빵 개수 가져온다. ( 동시에 우승자는 빵 개수 추가)
    const result = await firebaseUser.addBread(res["userInfo"].id)
    logger.log("남은 빵 : "+result.bread)
    // 빵이 없을때
    if(result.bread==-1){
        url = JSON.parse(process.env.URL).passnight_nobread
    }
    // 마지막 빵...
    else if(result.bread==0){
        url = JSON.parse(process.env.URL).passnight_lastbread
    }
    else{
        url = JSON.parse(process.env.URL).passnight_eatbread
    }
    const token = JSON.parse(process.env.TOKEN).passnight
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]

    responseObj.output["maxBet"] = result.maxBet
    responseObj.output["ment"] = result.ment
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives

    logger.log("응답\n")
    return res.json(responseObj)  
}
exports.passNight_finished = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")

    let url = ""
    let token = ""
    const result = await firebaseUser.checkPlayerState(res["userInfo"].id)

    // 죽은 플레이어일 경우
    if(result.state=="die"){
        firebaseUser.minusScore(res["userInfo"].id)
        url = JSON.parse(process.env.URL).dayresult_die
        token = JSON.parse(process.env.TOKEN).gamefinished_token
    }
    // 생존한 플레이어일 경우
    else{
        // 생존한 플레이어가 1명 남았을 때. WIN !!
        let lastPlayerCount = await firebaseUser.livePlayerCount()
        if(lastPlayerCount==1){
            firebaseUser.plusScore(res["userInfo"].id)
            url = JSON.parse(process.env.URL).dayresult_win
            token = JSON.parse(process.env.TOKEN).gamefinished_token
        }
        else{
            url = JSON.parse(process.env.URL).dayresult_live
            token = JSON.parse(process.env.TOKEN).nextbet_token
        }
    }
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]

    responseObj.output["passnight_prompt"] = result.passnight_prompt
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives
    
    logger.log("응답\n")
    return res.json(responseObj)
}
// day를 1 증가시키고 이전 day 정보를 그대로 복사한다.
exports.nextBet_finished = async function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    const result = await firebaseUser.createNextDayRoom(res["userInfo"].id)

    const url = JSON.parse(process.env.URL).ready_bet
    const token = JSON.parse(process.env.TOKEN).ready_bet
    const responseObj = JSON.parse(process.env.RESPONSE)
    const directives = responseObj.directives[0]

    responseObj.output["now_money"] = result.now_money
    directives.audioItem.stream["url"] = url
    directives.audioItem.stream["token"] = token
    responseObj.directives[0] = directives
    
    logger.log("응답\n")
    return res.json(responseObj)

}
exports.ad_finished = function(req, res){
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    firebaseUser.plusTicket(res["userInfo"].id, ++register["ticket"])
    const responseObj = JSON.parse(process.env.RESPONSE)
    return res.json(responseObj)
}
exports.default_finished = function(req, res){
    
}