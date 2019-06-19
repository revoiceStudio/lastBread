
module.exports = class MessageCommunication{
    async send(message1, message2){
        const message = {
            roomKey : message1,
            count : message2
        }
        console.log("마스터에게 메시지 보냄.",message)
        await process.send(message)
    }
    
}