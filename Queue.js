
module.exports = class Queue{

    constructor(){
        this.data = []
        console.log("큐가 생성되었습니다.")
    }

    enqueue(element){
        //여기서 push함수는 Array의 내장함수이다.
        //요소를 배열 맨 뒤에 삽입.
        this.data.push(element);
    }
    
    pop(){
        //shift는 Array의 내장함수이다. 
        //배열내의 맨 앞 요소를 반환하고 배열내에서 삭제한다.
        return this.data.shift();
    }
    
    //큐의 맨 젓번째 요소 반환
    front(){
        return this.data[0];
    }
    
    
    //큐의 맨 끝 요소 반환
    back(){
        return this.data[this.data.length-1];
    }
    
    
    //큐에 저장된 요소 모두 출력
    toString(){
        let q="";
        for(let i=0; i<this.data.length; i++)
        {
            q = q + this.data[i] + ", ";
        }
        return q
    }
    //큐 사이즈 반환
    size(){
        return this.data.length
    }

    //큐 비우기
    clear(){
        if(this.data.length==0){
            return true;
        }
        else{
            return false;
        }
    }
}