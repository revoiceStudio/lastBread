const logger = require('../log')
module.exports = class Firebase{

  //첫번쨰놈 요청이오면 얘가 기준
  setFirstTime(key){
    let nowTime = new Date().getTime()
    //getNow함수로 offset시간으로 바꿔준다.
    logger.log("이번 요청이 첫번쨰놈이라 시간을 서버에 때려박습니다."+ nowTime)
    fb.child('game/'+ key +"/firstTime").set(nowTime , ()=> {
      logger.log("오프셋은 이 시간에 종료되어야합니다."+ nowTime)
    })
  }

  //두번째놈부터느 이 함수로 와서 
  setMatchingOffset(key){
    return new Promise(async function(resolve) {
      let nowTime = new Date().getTime()

      fb.child('game/'+key+"/firstTime").once('value', function(data){
        const serverfirstTime = data.val();
        const playerOffset = nowTime - serverfirstTime
        logger.log("두번째놈 들어온 시간 : "+ nowTime)
        logger.log("두번째놈부터 오프셋 : "+ playerOffset)
        resolve(playerOffset)
      })
    })      
  }
  // 배팅 오프셋 맞춘다.
  setBettingOffset(){
    return new Promise(async function(resolve) {
      let nowTime = new Date().getTime()
      let serverfirstTime = 0
      await fb.child('game/'+register.room+"/firstTime").once('value',function(data){
        serverfirstTime = data.val()
      }).then(()=>{
        // 첫 번째 배팅한 놈이면
        if(serverfirstTime==0){
          fb.child('game/'+register.room+"/firstTime").set(nowTime)
          logger.log("배팅오프셋 첫 번째 배팅한 놈 시간 : "+nowTime)
          resolve(8000)
        }
        else{
            //+ 8000은 늘려줄 오프셋 음악이 너무 길어서 조절용 추가! 20000넘으면 안댐
            //실행해보면서 조절하기
            const playerOffset = 8000 + nowTime - serverfirstTime
            logger.log("배팅오프셋 두 번째 놈부터 오프셋 : "+playerOffset)
            resolve(playerOffset)
        }
      })      
    })      
  }
  // 유저 등록 (첫 플레이 시, 1번만 수행)
  setUser(id,name){
    return new Promise(async function(resolve) {
      fb.child('userInfo/'+ id).set({
          room : "",
          name: name,
          ticket: 3,
          score : 1000
      },function(error) {
          if (error) {logger.log("DB : 유저등록 중 에러 발생")} 
          else {logger.log("DB : 유저 등록")}
      })
    })
  }
  // 디비에 등록된 유저인지 체크한다.
  checkUser(id){
    return new Promise(async function(resolve) {
      fb.child('userInfo').child(id).once('value', function(data){
        logger.log('DB : 유저 확인')
        resolve(data.val())
      })
    })
  }
  // 티켓 -1
  minusTicket(id, ticket){
    return new Promise(async function() {
      await fb.child('userInfo/'+ id+"/ticket").set(ticket)
    })
  }
  // 티켓 +1
  plusTicket(id, ticket){
    fb.child('userInfo/'+ id+"/ticket").set(ticket)
    logger.log(id+"유저의 티켓이 추가되었습니다.")
  }
  // 티켓 갯수 알려줌
  ticketNum(id){
    return new Promise(async function(resolve) {
      fb.child('userInfo/'+ id+"/ticket").once('value',(data)=>{
        resolve(data.val())
      })
    })
  }
  // 점수 + 100
  plusScore(id){
    fb.child('userInfo/'+ id+"/score").once('value',async(data)=>{
      fb.child('userInfo/'+ id+"/score").set(data.val()+100)
    })  
  }
   // 점수 -20
  minusScore(id){
    fb.child('userInfo/'+ id+"/score").once('value',async(data)=>{
      fb.child('userInfo/'+ id+"/score").set(data.val()-10)
    })  
  }
  calScore(){
    fb.child('game/'+register.room).once('value', function(data){
      let roomInfo = data.val()
      let playerCount = roomInfo["playerCount"]
      fb.child('game/'+register.room+"/day"+roomInfo["day"]).once('value',async(data)=>{
        roomInfo = data.val()
        const keyOfId = Object.keys(roomInfo)
        for(i=0; i<playerCount; i++){
          if(roomInfo[keyOfId[i]].state=="die"){
            await fb.child('userInfo/'+ keyOfId[i]+"/score").once('value',async(data)=>{
              await fb.child('userInfo/'+ keyOfId[i]+"/score").set(data.val()-10)
            })  
          }
          else{
            await fb.child('userInfo/'+ keyOfId[i]+"/score").once('value',async(data)=>{
              await fb.child('userInfo/'+ keyOfId[i]+"/score").set(data.val()+100)
            })  
          }
        }
        logger.log("점수 계산 완료")        
      })
    })
  }
  // 점수 알려준다.
  ratingScore(id){
    return new Promise(async function(resolve) {
      fb.child('userInfo/'+ id+"/score").once('value',(data)=>{
        resolve(data.val())
      })
    })
  }

  // 리뷰 기능
  review(id){
    return new Promise(async function(resolve) {
      let ment = ""
      await fb.child('userInfo/'+ id+"/room").once('value',async (data)=>{
        const room = data.val()
        if(room==""){
          resolve("")
        }
        else{
          await fb.child('game/'+ room).once('value',(data)=>{
            const roomInfo = data.val()
            const dayCount = roomInfo["day"]
            for(let i=0; i<dayCount; i++){
              let dayInfo = roomInfo["day"+(i+1)]
              let keyOfId = Object.keys(dayInfo)
              let averageBet = 0
              let myBet = 0
              //이 날의 평균 배팅 금액
              for(let j=0; j<keyOfId.length-1; j++){
                averageBet += parseInt(dayInfo[keyOfId[j]].bet)
                //이 날의 나의 배팅 금액
                if(keyOfId[i]==id){
                  myBet = parseInt(dayInfo[keyOfId[j]].bet)
                }
                if(j==keyOfId.length-2){
                  averageBet = parseInt(averageBet/(keyOfId.length-1))
                }
              }
              let dayMent = i+1
              if(dayMent==1){dayMent="첫"}
              if(dayMent==2){dayMent="둘"}
              if(dayMent==3){dayMent="셋"}
              if(dayMent==4){dayMent="넷"}
              if(dayMent==5){dayMent="다섯"}
              if(dayMent==6){dayMent="여섯"}
              if(dayMent==7){dayMent="일곱"}
              if(dayMent==8){dayMent="여덟"}
              if(dayMent==9){dayMent="아홉"}
              if(dayMent==10){dayMent="열"}   
              //이 날에 내가 이겼을 때
              if(dayInfo.winner["uid"]==id){
                ment = ment + (dayMent+"째날, 당신은 배팅에 성공했습니다. 이 날의 평균 배팅금액은, "+averageBet+"원이었고,"+
                "당신은 "+ myBet +"원을 배팅했습니다.")
              }else{
                ment = ment + (dayMent+"째날, 배팅에 실패했습니다. 이 날의 평균 배팅금액은, "+averageBet+"원이었고,"+
                "당신은 "+ myBet +"원을 배팅했습니다.")
              }
              if(averageBet >= myBet){
                ment = ment + " 다음엔 좀 더 높은 금액을 불러보세요."
              }
              else{
                ment = ment + " 잘 배팅하셨네요."
              }            
            }
            logger.log(ment)
            resolve(ment)
          })
        }
      })
    })
  }
  // 플레이어 state 체크
  checkPlayerState(id){
    return new Promise(async function(resolve) {
      let roomInfo = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()
        logger.log('데이 : '+roomInfo["day"])
      }).then(()=>{
        fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/" + id+"/state").once('value',function(data){
          logger.log("플레이어 상태 : "+data.val())
          let diePlayer =""
          let dieMent = ""
          let livePlayerCount = 0
          const keyOfId = Object.keys(roomInfo["day"+roomInfo["day"]])
          for(let i=0; i<keyOfId.length; i++){
            if(roomInfo["day"+roomInfo["day"]][keyOfId[i]].state=="live"){
              livePlayerCount++
            }
            if(roomInfo["day"+roomInfo["day"]][keyOfId[i]].dieDay==roomInfo["day"]){
              diePlayer += roomInfo["day"+roomInfo["day"]][keyOfId[i]].player +"번,"
            }
          }
          if(diePlayer==""){
            dieMent = ""
          }else{
            dieMent = "어젯 밤, "+ diePlayer +" 생존자가 사망했습니다..." +"남은 생존자는 "+ livePlayerCount +"명 입니다."
          }
          let dayMent= (roomInfo["day"]+1)
          if(dayMent==1){dayMent="첫"}
          if(dayMent==2){dayMent="둘"}
          if(dayMent==3){dayMent="셋"}
          if(dayMent==4){dayMent="넷"}
          if(dayMent==5){dayMent="다섯"}
          if(dayMent==6){dayMent="여섯"}
          if(dayMent==7){dayMent="일곱"}
          if(dayMent==8){dayMent="여덟"}
          if(dayMent==9){dayMent="아홉"}
          if(dayMent==10){dayMent="열"}
          let result = {
            state : data.val(),
            passnight_prompt : dayMent+"째 날이 되었습니다,, " + dieMent+ "남은 빵은 " + roomInfo["day"+roomInfo["day"]][id].bread +"개 입니다. "
          }

          if(roomInfo["day"+roomInfo["day"]][id].bread==-1){    
            result.passnight_prompt = "당신은 4명 중"+(4-livePlayerCount)+"번째로, 사망하셨습니다."
          }
          
          resolve(result)
        })
        
      })
    })
  }
  
  // 현재 살아있는 플레이어 카운트
  livePlayerCount(){
    return new Promise(async function(resolve) {
      let roomInfo = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()
        logger.log('데이 : '+roomInfo["day"])
      }).then(()=>{
        let count = 0
        const keyOfId = Object.keys(roomInfo["day"+roomInfo["day"]])
        for(let i=0; i<keyOfId.length; i++){
          if(roomInfo["day"+roomInfo["day"]][keyOfId[i]].state=="live"){++count}
        }
        logger.log("현재 생존 플레이어 수 : "+count)
        resolve(count)
      })
    })
  }
  // 빵 개수 확인
  checkBread(id){
    return new Promise(async function(resolve) {
      let roomInfo = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()
        logger.log('데이 : '+roomInfo["day"])
      }).then(()=>{
        fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/" + id+"/bread").once('value', function(data){
          logger.log('빵 - '+data.val(),'개')
          resolve(data.val())
        })
      })
    })
  }

  //살아있는데 배팅안한 얘들 죽은상태로 변경한다.
  async liveButNotBeted(){
    let roomInfo = {}
    await fb.child('game/'+register.room).once('value', function(data){
      roomInfo = data.val()
      logger.log('데이 : '+roomInfo["day"])
    }).then(async ()=>{
      const dayInfo = roomInfo["day"+roomInfo["day"]]
      const keyOfId = Object.keys(dayInfo)
      for(let i=0; i<keyOfId.length-1; i++){
        if(dayInfo[keyOfId[i]].state == "live" && dayInfo[keyOfId[i]].betState=="no"){
          dayInfo[keyOfId[i]].state="die"
          dayInfo[keyOfId[i]].dieDay=roomInfo["day"]
        }
      }   
      await fb.child('game/'+register.room+"/day"+roomInfo["day"]).set(dayInfo)
    })
  }
  // winner는 빵 추가와 동시에 빵 개수 반환
  addBread(id){
    return new Promise(async function(resolve) {
      let added = 1
      await fb.child('game/'+register.room+"/addBreadCount").once('value',(data)=>{
        if(data.val()==0){
          added = 0
        }
      })
     
      let roomInfo = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()
        logger.log('데이 : '+roomInfo["day"])
      }).then(()=>{
        let bread = roomInfo["day"+roomInfo["day"]][id].bread
        if(roomInfo["day"+roomInfo["day"]]["winner"].uid!=""){
          if(added==0){
            fb.child('game/'+register.room+"/addBreadCount").set(1)
            roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid].bread = ++roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid].bread
            bread = roomInfo["day"+roomInfo["day"]][id].bread
            roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid].state = "live"
            roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid].dieDay = ""
            fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/"+roomInfo["day"+roomInfo["day"]]["winner"].uid).set(
              roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid]
            )
          }
        }
        let result ={
          maxBet :roomInfo["day"+roomInfo["day"]]["winner"].maxBet,
          ment : '',
          bread : bread
        }
        if(roomInfo["day"+roomInfo["day"]]["winner"].maxCount==1){
          result.ment = roomInfo["day"+roomInfo["day"]][roomInfo["day"+roomInfo["day"]]["winner"].uid].player+"번 생존자가 빵을 차지했습니다."
        }
        else{
          result.ment = roomInfo["day"+roomInfo["day"]]["winner"].maxCount + "명이 같은 금액을 배팅해, 아무도 빵을 얻지 못했습니다."
        }
        logger.log("빵추가완료")
        resolve(result)
      })
    })
  }
  // room 플레이어 수 확인
  checkRoom(key){
    return new Promise(async function(resolve) {
      fb.child('game/'+key+"/firstTime").set(0)
      fb.child('game/'+key+"/day1").once('value', function(data){
        logger.log("룸 체크 "+data.val())
        const count = Object.keys(data.val()).length;
        resolve(count)
      })
    })  
  }
  // 매칭된 플레이어 수 저장
  /*setMatchingPlayerNum(key, num){
    fb.child('game/'+ key +"/playerCount").set(num, ()=> {
      logger.log("DB : 매칭된 플레이어 수: "+ num)
    })
  }*/
  // 몇 번재 플레이어인지 가져온다.
  playerNum(id, key){
    return new Promise(async function(resolve) {
      let roomInfo = {}
      await fb.child('game/'+key).once('value', function(data){
        roomInfo = data.val()
      }).then(()=>{
        const keyOfId = Object.keys(roomInfo["day1"])
        let userPlayerCount = 0
        for(let i=0; i<keyOfId.length-1; i++){
          if( keyOfId[i]==id ){
            roomInfo["day1"][id].player = i+1
          }
          if(keyOfId[i]!="A" && keyOfId[i]!="B" && keyOfId[i]!="C"){
            userPlayerCount++
          }
        }
        
        if(roomInfo["day1"][id].player==1){
          fb.child('game/'+ key +"/playerCount").set(userPlayerCount, ()=> {
            logger.log("DB : 매칭된 플레이어 수: "+ userPlayerCount)
          })
        }
        fb.child('game/'+key+"/day1/"+ id+"/player").set(roomInfo["day1"][id].player)
        resolve(roomInfo["day1"][id].player)
        /*fb.child('game/'+ key+"/day"+roomInfo["day"]+"/" + id+"/player").once('value', function(data){
          resolve(data.val())
        })*/
      })
    })
  }

  //게임방 개설
  createRoom(id, key){
    const updateData = {
      bet : 0,
      bread : 2,
      money : 100000,
      state : "live",
      dieDay : "",
      betState  : "no"
    } 
    fb.child('game/'+key+"/day").set(
      1
    ,function(error) {
        if (error) {logger.log("DB : 게임방 개설 중 에러")} 
        else {
          logger.log("DB : 게임방 개설")
        }
    }).then( async ()=>{
      await fb.child('game/'+key).child("day1").once('value',(data)=>{ 
        if(data.val()==null){
          updateData["player"] = 0
        }else{
          const playerNum = Object.keys(data.val()).length;
          //updateData["player"] = (playerNum-1) + 1
          updateData["player"] = 0
        }
      })
    }).then(()=>{
      fb.child('game/'+key+"/day1/winner").set({
       
          uid : "",
          maxBet : -1,
          maxCount : 1
       
      })
    }).then(()=>{
      fb.child('game/'+key+"/day1/" + id).set(
        updateData
      )
      const updates={}
      updates['userInfo/'+ id+"/room"] = key
      fb.update(updates)
    })
  }
  // 다음 날로 넘어간다.
  createNextDayRoom(id){
    return new Promise(async function(resolve){
      let created = 1
      await fb.child('game/'+register.room+"/dayCount").once('value',(data)=>{
        if(data.val()==-1){
          created = -1
        }
      })
      
        
        let roomInfo = {}
        let nowDay = 0
        await fb.child('game/'+register.room+"/day").once('value',function(data){
          nowDay = data.val() 
        })
        await fb.child('game/'+register.room+"/day"+nowDay).once('value', function(data){
          roomInfo = data.val()
        })
        // winner 초기화
        roomInfo["winner"].uid = ""
        roomInfo["winner"].maxBet = -1
        roomInfo["winner"].maxCount = 1
        
        // 배팅 초기화
        const keyOfId = Object.keys(roomInfo)
        for(let i=0; i<keyOfId.length-1; i++){
          roomInfo[keyOfId[i]].bet = 0
          roomInfo[keyOfId[i]].betState = "no"
        }
        if(created==-1){
          fb.child('game/'+register.room+"/dayCount").set(1)
          fb.child('game/'+register.room+"/day"+(nowDay+1)).set(roomInfo)
          fb.child('game/'+register.room+"/day").set(nowDay+1)
          fb.child('game/'+register.room+"/firstTime").set(0)
        }
        let result = {
          now_money :roomInfo[id].money
        }
        resolve(result)
      
    })
  }
  // AI 추가
  addAI(id, key){
    const updateData = {
      bet : 0,
      bread : 2,
      money : 100000,
      state : "live",
      dieDay : "",
      betState  : "no"
    } 
    if(id=="A"){
      updateData["player"] = "2"
    }
    else if(id=="B"){
      updateData["player"] = "3"
    }
    else if(id=="C"){
      updateData["player"] = "4"
    }
    fb.child('game/'+key+"/day1/" + id).set(updateData, ()=> {
      logger.log("AI 추가:"+ id)
    })
      
  }
  nowMoney(id){
    return new Promise(async function(resolve) {
      let roomInfo = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()
        if(!roomInfo){return resolve(roomInfo)}
        logger.log('데이 : '+roomInfo["day"])
      }).then(()=>{
        if(roomInfo){
          fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/" + id+"/money").once('value',function(data){
            resolve(data.val())
          })
        }
      })
    })
  }
  // 배팅가격, 현재 남은돈 계산
  addBet(id, bet){
    return new Promise(async function(resolve) {
      fb.child('game/'+register.room+"/dayCount").set(-1)
      fb.child('game/'+register.room+"/addBreadCount").set(0)
      let roomInfo = {}
      let keyOfId = {}
      fb.child('game/'+register.room).once('value', function(data){
        roomInfo = data.val()      
        keyOfId = Object.keys(roomInfo["day1"])      
        logger.log('데이 : '+roomInfo["day"])
        if(keyOfId.length<5){
          return resolve(null)
        }else{
          console.log("트루!!!!!!!!!!!!")
          return resolve(true)
        }
      }).then(async()=>{
        if(keyOfId.length<5){
          return resolve(null)
        }
        console.log("트루222222222!!!!!!!!!!!!")
        const money = roomInfo["day"+roomInfo["day"]][id].money

        //bet 머니 계산. bet 금액이 현재 money보다 클 경우 올인 처리.
        if(bet>money){bet = money}
        roomInfo["day"+roomInfo["day"]][id].money = money - bet 
        roomInfo["day"+roomInfo["day"]][id].bet = bet
        roomInfo["day"+roomInfo["day"]][id].bread = --roomInfo["day"+roomInfo["day"]][id].bread

        //배팅 처리
        roomInfo["day"+roomInfo["day"]][id].betState = "yes"

        roomInfo = await playerState(roomInfo, id)
        roomInfo = await winner(roomInfo, id, bet) 
        fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/winner").set(roomInfo["day"+roomInfo["day"]].winner)
        fb.child('game/'+register.room+"/day"+roomInfo["day"]+"/" + id).set(
          roomInfo["day"+roomInfo["day"]][id]
          , function(){
            logger.log('DB : '+bet+'원 배팅 완료')
            
            //플레이어가 4명보다 작으면 a,b,c도 랜덤으로 배팅한다.
            const count = roomInfo["playerCount"];
            if(count==1){
              if(checkAILive(roomInfo,"A") && roomInfo["day"+roomInfo["day"]]["A"].betState == "no"){
                AIBet(roomInfo,"A")
                playerState(roomInfo, "A")
                winner(roomInfo, "A", roomInfo["day"+roomInfo["day"]]["A"].bet) 
                roomInfo["day"+roomInfo["day"]]["A"].betState = "yes"
              }
              if(checkAILive(roomInfo,"B") && roomInfo["day"+roomInfo["day"]]["B"].betState == "no"){
                AIBet(roomInfo,"B")
                playerState(roomInfo, "B")
                winner(roomInfo, "B", roomInfo["day"+roomInfo["day"]]["B"].bet) 
                roomInfo["day"+roomInfo["day"]]["B"].betState = "yes"
              }
              if(checkAILive(roomInfo,"C") && roomInfo["day"+roomInfo["day"]]["C"].betState == "no"){
                AIBet(roomInfo,"C")   
                playerState(roomInfo, "C")
                winner(roomInfo, "C", roomInfo["day"+roomInfo["day"]]["C"].bet) 
                roomInfo["day"+roomInfo["day"]]["C"].betState = "yes"
              }
              fb.child('game/'+register.room+"/day"+roomInfo["day"]).set(
                roomInfo["day"+roomInfo["day"]]
              )

            }
            else if(count==2){
              if(checkAILive(roomInfo,"B") && roomInfo["day"+roomInfo["day"]]["B"].betState == "no"){
                AIBet(roomInfo,"B")
                playerState(roomInfo, "B")
                winner(roomInfo, "B", roomInfo["day"+roomInfo["day"]]["B"].bet) 
                roomInfo["day"+roomInfo["day"]]["B"].betState = "yes"
              }
              if(checkAILive(roomInfo,"C") && roomInfo["day"+roomInfo["day"]]["C"].betState == "no"){
                AIBet(roomInfo,"C")   
                playerState(roomInfo, "C")
                winner(roomInfo, "C", roomInfo["day"+roomInfo["day"]]["C"].bet) 
                roomInfo["day"+roomInfo["day"]]["C"].betState = "yes"
              }
              fb.child('game/'+register.room+"/day"+roomInfo["day"]).set(
                roomInfo["day"+roomInfo["day"]]
              )
            }
            else if(count==3){
              if(checkAILive(roomInfo,"C") && roomInfo["day"+roomInfo["day"]]["C"].betState == "no"){
                AIBet(roomInfo,"C")   
                playerState(roomInfo, "C")
                winner(roomInfo, "C", roomInfo["day"+roomInfo["day"]]["C"].bet) 
                roomInfo["day"+roomInfo["day"]]["C"].betState = "yes"
              }
              fb.child('game/'+register.room+"/day"+roomInfo["day"]).set(
                roomInfo["day"+roomInfo["day"]]
              )
            }
        })
      })
    })
  }
  


}

function winner(roomInfo, id, bet){
  // winner 결정
  return new Promise(async function(resolve) {
    // maxBet이 같아지는 순간 해당 플레이어들은 winner에서 사라진다.
    if(roomInfo["day"+roomInfo["day"]].winner.maxBet == bet){
      roomInfo["day"+roomInfo["day"]].winner.maxCount = ++roomInfo["day"+roomInfo["day"]].winner.maxCount
      roomInfo["day"+roomInfo["day"]].winner.uid = ""
    }    
    // 현재 사용자가 배팅한 금액이 더 큰 경우
    if(roomInfo["day"+roomInfo["day"]].winner.maxBet < bet){
      roomInfo["day"+roomInfo["day"]].winner.maxBet = bet
      roomInfo["day"+roomInfo["day"]].winner.maxCount = 1
      roomInfo["day"+roomInfo["day"]].winner.uid = id
    }
    logger.log("winner결정")
    resolve(roomInfo)
  })
 
}

function playerState(roomInfo, id){
  return new Promise(async function(resolve) {
    //state 결정
    if (roomInfo["day"+roomInfo["day"]][id].bread == -1){
      roomInfo["day"+roomInfo["day"]][id].state = "die"
      roomInfo["day"+roomInfo["day"]][id].dieDay = roomInfo["day"]
    }
    logger.log("플레이어 live OR die 결정")
    resolve(roomInfo)
  })
}

function randomBet(min, max){
  var ranNum = Math.floor(Math.random()*(max-min+1)) + min;
  return ranNum;
}

function AIBet(roomInfo, id){
  const money = roomInfo["day"+roomInfo["day"]][id].money
  const bet = randomBet(0, money/10000) * 10000
  roomInfo["day"+roomInfo["day"]][id].bread = --roomInfo["day"+roomInfo["day"]][id].bread
  roomInfo["day"+roomInfo["day"]][id].money = money - bet
  roomInfo["day"+roomInfo["day"]][id].bet = bet
}

function checkAILive(roomInfo, id){
  if(roomInfo["day"+roomInfo["day"]][id].state=="live"){
    return true
  }
  else{
    return false
  }
}