let gameSeq=[];

let userSeq=[];

let btns=["yellow","red","blue","green"];

let started=false;

let level=0;

let h3=document.querySelector("h3");
document.addEventListener("keypress", function(){
    if(started==false){
        started=true;
        levelUpdate();
    }
});

function btnflash(btn){
    btn.classList.add("flash");
    setTimeout(function(){
     btn.classList.remove("flash");
    }, 300);
}
let h2=document.querySelector("h2");

function levelUpdate(){
    userSeq=[];
    level++;
    h2.innerText=`Level ${level}`;
    let randIdx=Math.floor(Math.random()*4);
    let randcolor=btns[randIdx];
    let randbtn=document.querySelector(`.${randcolor}`);
    gameSeq.push(randcolor);    
    btnflash(randbtn);
}
    function checkans(idx){
        if(userSeq[idx]===gameSeq[idx]){
           if(userSeq.length==gameSeq.length){
            setTimeout(levelUpdate,1000);
           }
        } else{
            h2.innerText="Game Over! Press any key to Play Again";
            h3.innerText=`Your Score is ${level}`;
            document.querySelector("body").style.backgroundColor="red";
            setTimeout(function(){
                document.querySelector("body").style.backgroundColor="white";
            },150);
            reset();
        }
    }
function btnrpress(){
   let btn=this;
   btnflash(btn);
   usercolor=btn.getAttribute("id");
   userSeq.push(usercolor);
   checkans(userSeq.length-1);
}
let allbtns=document.querySelectorAll(".color");
for(btn of allbtns){
    btn.addEventListener("click", btnrpress); 
}
function reset(){
    started=false;
    gameSeq=[];
    userSeq=[]; 
    level=0;
}

