const logger = require('../log')
exports.stop = function(req, res){

    const jsonObj = req.body
    logger.log('광고 시작 request가 왔습니다 : \n'+jsonObj)
    const responseObj = {}
    const audioItemObj = {}
    const streamObj = {}
    const progressReportObj = {}
    
    progressReportObj["progressReportDelayInMilliseconds"] = 5000
    streamObj["url"] = "http://59.26.206.241:2022/Resource/ad/gan.mp3"
    streamObj["offsetInMilliseconds"] = 0
    streamObj["progressReport"] = progressReportObj
    streamObj["token"] = "matching_token"
    streamObj["expectedPreviousToken"] = "matching_token"

    audioItemObj["stream"] = streamObj
    audioItemObj["metadata"] = {}
    responseObj["type"] = "AudioPlayer.Play"
    responseObj["audioItem"] = audioItemObj
    logger.log(responseObj)
    logger.log('광고 시작 response를 보냅니다. : \n',responseObj)
    return res.json(responseObj)
}

exports.pause = function(req, res){

    const jsonObj = req.body
    const responseObj = {}
    logger.log(jsonObj)
    return res.json(responseObj)

}
exports.resumed = function(req, res){

    const jsonObj = req.body
    const responseObj = {}
    logger.log(jsonObj)
    return res.json(responseObj)

}
exports.failed = function(req, res){

    const jsonObj = req.body
    const responseObj = {}
    logger.log(jsonObj)
    return res.json(responseObj)

}