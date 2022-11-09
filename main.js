console.log("main loading")

function beep1(){
    var audio = new Audio('beep1.mp3');
    audio.play();
}
function beep2(){
    var audio = new Audio('beep2.mp3');
    audio.play();
}
let newId = function(){
    let id = 0;
    return ()=>{return id++};
}();
class TimingDevice{
    constructor(paused=true){
        this.phaseStartTime = Date.now();
        this.timeAccumulator = 0;
        this.paused = paused;
        this.runAts = new Array();
    }
    pause(){
        if(!this.paused){
            this.timeAccumulator+=Date.now()-this.phaseStartTime;
            this.paused = true;
            this.stopRunAts();
        }
    }
    resume(){
        if(this.paused){
            this.paused = false;
            this.phaseStartTime= Date.now();
            this.startRunAts();
        }
    }
    startRunAts(){
        if(this.hasScheduledRunAts===true){
            throw "Called twice without a call to stopRunAts first";
        }
        this.hasScheduledRunAts = true;
        this.runAts = this.runAts.map(function({f,endAt}){
            let delay = endAt-this.getSeconds(false);
            let id = setTimeout(f,delay*1000);
            return ({f:f,endAt:endAt,id:id});
            
        }.bind(this));
    }
    stopRunAts(){
        if(this.hasScheduledRunAts===false){
            throw "Called twice without a call to startRunAts first";
        }
        this.hasScheduledRunAts = false;
        this.runAts = this.runAts.map(function({f,endAt,id}){
            if(endAt<this.getSeconds(false)){
                return false;
            }
            clearTimeout(id);
            return {f:f,endAt:endAt};
        }.bind(this)).filter((x)=>!(x===false));
    }
    runAfterDelay(f,delay){
        let endAt = delay+this.getSeconds(false);
        //inefficent, can improve by making startSingleRunAt
        if(this.hasScheduledRunAts){
            this.stopRunAts();
            this.runAts.push({f:f,endAt:endAt});
            this.startRunAts();
        }
        else{
            this.runAts.push({f:f,endAt:endAt});
            if(!this.paused){
            this.startRunAts();
            }
        }
    }
    runAt(f,secondMark){
        this.runAfterDelay(f,secondMark-this.getSeconds(false));
    }
    getTime(){
        if(this.paused){
            return this.timeAccumulator;
        }
        return (Date.now()-this.phaseStartTime)+this.timeAccumulator;
    }
    getSeconds(floored=true){
        let val= this.getTime()/(1000);
        return floored ? Math.floor(val) : val;
    }
    getMilliseconds(){
        return this.getTime()
    }

}
function formatClock(hundreths){
    hundreths = Math.floor(hundreths);
    let hun = hundreths % 100;
    let seconds = Math.floor(hundreths/100);
    let ses = seconds%60;
    let minutes = Math.floor(seconds/60);
    return `${minutes.toString().padStart(2,'0')}:${ses.toString().padStart(2,'0')}.${hun.toString().padStart(2,'0')}`
}
class Timer{
    constructor(){
        this.tickFrequency = 100;
        this.workDuration = 45;
        this.restDuration = 10;
        this.reset();
    }
    tickCountdown(){
        console.log(this.timingDevice.getSeconds(false));
        if(this.running){
            let secondsIntoCycle = this.timingDevice.getSeconds(false) % (this.restDuration+this.workDuration);
            let phase = secondsIntoCycle<this.restDuration ? 'rest' : 'work';
            let secondsIntoPhase = phase==='rest' ? secondsIntoCycle : secondsIntoCycle-this.restDuration;
            
            let phaseLength = phase==='rest' ? this.restDuration : this.workDuration;
            let numEffectsInPhase = phase=== 'rest' ? this.restCountdownDuration : this.workCountdownDuration;
            let secondsLeftInPhase = phaseLength-secondsIntoPhase;
            this.displayPhase(phase);
            secondsLeftInPhase = Math.round(secondsLeftInPhase);
            if(secondsLeftInPhase<=numEffectsInPhase){
                if(phase==='rest'){
                    this.restCoundown(secondsLeftInPhase+1);
                }else{
                    this.workCountdown(secondsLeftInPhase+1);
                }
            }
        }

        this.timingDevice.runAt(this.tickCountdown.bind(this),this.timingDevice.getSeconds()+1);
        //this.timingDevice.runAt(this.tickCountdown.bind(this),this.timingDevice.getSeconds(true)+1); //run every second
    }
    tickClockface(){
        //pasted lol
        if(this.running){
            let secondsIntoCycle = this.timingDevice.getSeconds(false) % (this.restDuration+this.workDuration);
            let phase = secondsIntoCycle<this.restDuration ? 'rest' : 'work';
            let secondsIntoPhase = phase==='rest' ? secondsIntoCycle : secondsIntoCycle-this.restDuration;
            let phaseLength = phase==='rest' ? this.restDuration : this.workDuration;
            let numEffectsInPhase = phase=== 'rest' ? this.restCountdownDuration : this.workCountdownDuration;
            let secondsLeftInPhase = phaseLength-secondsIntoPhase;
            this.displayClockface(Math.floor(secondsLeftInPhase*100));
        }
        this.timingDevice.runAt(this.tickClockface.bind(this),Math.floor((this.timingDevice.getMilliseconds()/10)+1)/100);//run every 100th of a second
        
    }
    reset(){
        this.timingDevice = new TimingDevice();
        this.timingDevice.pause();
        this.running = false;
        this.tickCountdown();
        this.tickClockface();
        document.getElementById("reset").disabled = true;
        this.updateStopStart();
        this.displayClockface(0);
    }
    start(){
        document.getElementById("reset").disabled = true;
        this.timingDevice.resume();
        this.running = true;
    }
    stop(){
        this.timingDevice.pause();
        document.getElementById("reset").disabled = false;
        this.running = false;
    }
    //User effects
    displayClockface(hundreths){
        let clock = document.getElementById("clock-face");
        clock.innerText = formatClock(hundreths);
        this.showStatistics();
    }
    workCountdown(n){
        console.log("beep1",n)
        beep2();
    }
    restCoundown(n){
        console.log("beep2",n);
        beep1();
    }
    displayPhase(phase){
        document.getElementById("phase-value").innerText = phase;
        document.getElementById("clock-face").setAttribute("phase",phase);
    }
    //User configuration
    get workDuration(){return this._workDuration;}
    get restDuration(){return this._restDuration;}
    set workDuration(val){
        this._workDuration= val;
        this.workCountdownDuration = Math.min(5,Math.floor(this.workDuration/2));
    }
    set restDuration(val){
        this._restDuration= val;
        this.restCountdownDuration = Math.min(3,Math.floor(this.workDuration/2));
    }
    updateStopStart(){
        let button = document.getElementById("start-stop");
        if(this.running){
            button.setAttribute("toggle","stop");
            
        }
        else{
            button.setAttribute("toggle","start");
        }
    }
    showStatistics(){
        document.getElementById("workout-duration").innerText = formatClock(this.timingDevice.getMilliseconds()/10);
        document.getElementById("round-value").innerText = 1+Math.floor(this.timingDevice.getSeconds()/(this.workDuration+this.restDuration));
    }
}
let timer = new Timer();
timer.updateStopStart();

document.getElementById("start-stop").onclick = (e)=>{
    if(timer.running){
        timer.stop();
    }
    else{
        timer.start();
    }
    timer.updateStopStart();
}
document.getElementById("reset").onclick = (e=>{
    timer.reset();
});


document.getElementById("work").value = timer.workDuration;
document.getElementById("rest").value = timer.restDuration;
document.getElementById("work").oninput = (e)=>{
    timer.workDuration = parseInt(e.target.value)
};

document.getElementById("rest").onchange = (e)=>{
    timer.restDuration = parseInt(e.target.value)
};







