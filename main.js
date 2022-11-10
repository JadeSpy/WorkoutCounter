
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
        this.scheduledIntervals = new Map();
    }
    pause(){
        if(!this.paused){
            this.timeAccumulator+=Date.now()-this.phaseStartTime;
            this.paused = true;
        }
    }
    resume(){
        if(this.paused){
            this.paused = false;
            this.phaseStartTime= Date.now();
        }
    }
    async runInterval(id){
        let errorToleranceLess = 2;//ms
        while(true){
            let x = this.scheduledIntervals.get(id);
            if(x===undefined){
                break;
            }
            let now = this.getMilliseconds();
            let relNow = now-x.offset;
            let timeTillRun;
            if(relNow<0){
                timeTillRun = Math.abs(relNow)+x.delay-((now)%x.delay);
            }
            else{
                timeTillRun = x.delay-((relNow)%x.delay);
            }
            let expectedToRunAt = now+timeTillRun;
            while(true){
                let now = this.getMilliseconds();
                let relNow = now-x.offset;
                if(relNow<0){
                    timeTillRun = Math.abs(relNow)+x.delay-((now)%x.delay);
                }
                else{
                    timeTillRun = x.delay-((relNow)%x.delay);
                }
                await new Promise(r => setTimeout(r, timeTillRun));
                let offBy = expectedToRunAt-this.getMilliseconds();
                if(offBy>errorToleranceLess){
                    //console.log("Off by",offBy)
                    continue;
                }
                x.f();
                break;

            }
        }
    }

    setInterval(f,delay,offset=0){
        let x = {f:f,delay:delay,offset:offset};
        let id = newId();
        this.scheduledIntervals.set(id,x);
        this.runInterval(id,x);
        return id;
    }
    removeInterval(id){
        this.scheduledIntervals.delete(id);
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
        //console.log("tick countdown");
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
                    this.restCoundown(secondsLeftInPhase);
                }else{
                    this.workCountdown(secondsLeftInPhase);
                }
            }
            else{
                if(phase==='work' && secondsLeftInPhase==Math.floor(this.workDuration/2)){
                    this.workCountdown(secondsLeftInPhase)
                }
            }
        }

        //this.timingDevice.runAt(this.tickCountdown.bind(this),this.timingDevice.getSeconds()+1);
        //this.timingDevice.runAt(this.tickCountdown.bind(this),this.timingDevice.getSeconds(true)+1); //run every second
    }
    tickClockface(){
        //console.log("tick clock-face");
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
        //this.timingDevice.runAt(this.tickClockface.bind(this),Math.floor((this.timingDevice.getMilliseconds()/10)+1)/100);//run every 100th of a second
        
    }
    reset(){
        this.timingDevice = new TimingDevice();
        this.timingDevice.pause();
        this.running = false;
        this.timingDevice.setInterval(this.tickClockface.bind(this),10,10);
        this.timingDevice.setInterval(this.tickCountdown.bind(this),1000,0);
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
        if(n===1){
        beep1();
        }
        else{beep2();}
    }
    restCoundown(n){
        //console.log("here:",n)
        if(n===1){
        beep2();
        }
        else{
            beep1();
        }
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
        this.workCountdownDuration = Math.min(4,Math.floor(this.workDuration));
    }
    set restDuration(val){
        this._restDuration= val;
        this.restCountdownDuration = Math.min(4,Math.floor(this.workDuration));
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






