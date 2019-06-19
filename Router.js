const express = require('express')
const router = express.Router()
router.use(express.json())

/***      audio 이벤트 처리      ***/
const audioPlay = require('./nugu_event/AudioPlay')
const audioFinish = require('./nugu_event/AudioFinish')
const gameEvent = require('./nugu_event/GameEvent')
// audio 플레이
router.post('/ad_start', audioPlay.ad_start)
router.post('/matching_start', audioPlay.matching_start)
// audio 종료
router.post('/matching_finished',audioFinish.matching_finished)
router.post('/intro_finished',audioFinish.intro_finished)
router.post('/betting_start',audioFinish.betting_start)
router.post('/bet_finished',audioFinish.bet_finished)
router.post('/passnight_finished',audioFinish.passNight_finished)
router.post('/next_bet',audioFinish.nextBet_finished)
router.post('/ad_finished', audioFinish.ad_finished)
router.post('/default_finished', audioFinish.default_finished)

/***  게임 부가 기능 ***/
router.post('/ticket_start', gameEvent.ticket_start)
router.post('/review_start', gameEvent.review_start)
router.post('/rating_start', gameEvent.rating_start)

module.exports = router