require('json-dotenv')('./nugu_event/.config.json')
require('json-dotenv')('.env.json')
require('dotenv').config({path:'setting.env'})
const express = require('express')
const request = require('request')
const firebase = require('firebase')
const router = require('./Router')
const User = require('./firebase/User')
const logger = require('./log')
const app = express()
const port = process.env.PORT

//1. 파이어베이스 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(JSON.parse(process.env.FB_CONFIG))  
    //lastbread 프로젝트의 realtime database 루트 경로를 가져온다.
    global.fb = firebase.database().ref()
    logger.log("파이어베이스 초기화 완료.")  
}

//2. 파이어베이스 연결, 카운트
global.firebaseUser = new User()
global.cluster = require('cluster')
global.globalData = {
    roomKey :"",
    count : 0
}
const numCPUs = require('os').cpus().length
// 부모 프로세스 부분, 자식 프로세스 cpu 갯수 만큼 생성 (여기선 4개 생성)
if(cluster.isMaster){
    for(let i=0; i<numCPUs; i++){
        logger.log('worker process create')
        let worker = cluster.fork()
        
        worker.on("message", (message)=>{
            logger.log("마스터 메시지 받음 : ."+message)
            for (const id in cluster.workers) {
                let worker = cluster.workers[id];
                worker.send(
                    message
                );
            }
        }) 
    }
}
// 자식프로세스 처리 부분, 4개의 요청을 분담하여 각각 처리
else{
    process.on('message', function(message) {
        globalData = message
    });

    app.use(express.json())
    //3. OAuth 인증 확인
    app.use('/lastbread', function(req, res, next){
        
        const jsonObj = req.body
        logger.log('OAuth 토큰 확인...')
        if(typeof jsonObj.context !== "undefined" ){        
            if(typeof jsonObj.context.session["accessToken"] === 'undefined'){
                logger.log("OAuth 연동이 되지 않았습니다.")
                const responObj = JSON.parse(process.env.RESPONSE)
                responObj["resultCode"] = JSON.parse(process.env.EXCEPTION).OAuth
                responObj["directives"] = []
                res.json(responObj)
            }
            else{
                const accessToken = jsonObj.context.session["accessToken"]
                const url = JSON.parse(process.env.URL).googleAPI
                const options = {
                    'url' : url+ accessToken
                }
                //4.구글 유저 정보 요청
                request(options, async (error, response, body) =>{
                    if (error) throw error
                    logger.log("OAuth 인증 완료")
                    res["userInfo"] = JSON.parse(body)

                    //5. 유저가 DB에 등록되어 있는지 검사
                    global.register = await firebaseUser.checkUser(res["userInfo"].id)
                    logger.log("레지스터 : "+ register)
                    //5.1. DB에 등록 안되어 있으면 파이어베이스에 계정 연동. (계정당 1회)
                    if(register==null){
                        const credential = await firebase.auth.GoogleAuthProvider.credential(null, accessToken);
                        await firebase.auth().signInWithCredential(credential).then(async function(result) {
                            logger.log('파이어베이스 연동 완료.')
                            await firebaseUser.setUser(res["userInfo"].id, res["userInfo"].name)       
                        }).catch(function(error){
                            logger.log(error.code)
                        })
                    }
                    // 계속 진행.
                    next()
                })
            }
        }
        else{return res.json({'test':'OK'})}
    })
    //5. 누구에게 응답
    app.use('/lastbread', router)

    app.listen(port,() =>{
        logger.log("port is "+ port)
    })
}