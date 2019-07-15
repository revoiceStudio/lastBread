const logger = require('../log')
exports.ticket_start = async function(req, res) {
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")

    const ticketNum = await firebaseUser.ticketNum(res["userInfo"].id)

    const responseObj = JSON.parse(process.env.RESPONSE)
    responseObj.output["ticket"] = ticketNum
    responseObj.directives[0] = []
    
    logger.log("응답\n")
    return res.json(responseObj)
}
exports.review_start = async function(req, res) {
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")
    const responseObj = JSON.parse(process.env.RESPONSE)

    const reviewMent = await firebaseUser.review(res["userInfo"].id)
    if(reviewMent==""){
        responseObj.output["review_ment"] = "게임 기록이 없네요. 게임을 플레이 해주세요~"
    }
    else{
        responseObj.output["review_ment"] = reviewMent
    }
    responseObj.directives[0] = []
    
    logger.log("응답\n")
    return res.json(responseObj)
}
exports.rating_start = async function(req, res) {
    const jsonObj = req.body
    logger.log(jsonObj.action["actionName"]+" 요청 수행 중...")

    const ratingScore = await firebaseUser.ratingScore(res["userInfo"].id)

    const responseObj = JSON.parse(process.env.RESPONSE)
    responseObj.output["rating_score"] = ratingScore
    responseObj.directives[0] = []
    
    logger.log("응답\n")
    return res.json(responseObj)
}