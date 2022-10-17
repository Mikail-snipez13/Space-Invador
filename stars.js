
//configuration
const CANVAS = document.getElementById('canvas');
const CTX = CANVAS.getContext('2d');
const CORNERS = [new Vector(0,0), new Vector(CANVAS.width, 0), new Vector(CANVAS.width, CANVAS.height), new Vector(0, CANVAS.height)]
const FPS = 60;
const HIT_TIMEOUT = 3000; //milliseconds
const MAX_HEARTS = 3;
    
//in-game configuration
var enableMouseLines = false;
var enableDebugMode = false;
var fullScreen = false;

//in-game variable
const canvasCenter = new Vector(CANVAS.width/2, CANVAS.height/2)
var ASTEROID_COUNT = 10;
var stones = new Array(ASTEROID_COUNT);
var stone_v = 5;
var mouseX = 0;
var mouseY = 0;
var level = 1;
var interval = null;
var points = 0;
var hearts = 3;
var shouldRender = true;
var showShuttle = false;
var starfighter = new Starfighter(canvasCenter, 1.2)
var gameover = false;
var menu = true;
var game = false;
var pause = false;

//hit animation
var hit = false;
var byHitVisible = false;
var hitAnimationTimeout = false;

//startSide
var menuWidth = 200;
var menuHeight = 100;
var startSide = true;

//settings
var settings = false;
var settings_radio = []
var settings_button = []

//listener
CANVAS.addEventListener('mousemove', mouseOver)
document.addEventListener('keyup', keyDown)
CANVAS.addEventListener('mousedown', mouseClick)

function getMouseVector() {
    return new Vector(mouseX, mouseY)
}

function drawBackground() {
    CTX.beginPath();
    CTX.fillStyle = "black";
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
    CTX.fill();
}

function randomValue(min, max) {
    var value;
    do {
        value = Math.round(Math.random() * max) - Math.round(Math.random() * (Math.abs(min) + Math.abs(max)))
    } while (value == 0); 
    return value;
}

function createStone() {

    var spawn = -100;
    var randomSpawnSite = Math.round(Math.random() * 100);
    //var randomSpawnSite = 0;
    var pos;
    var direction;
    
    if (randomSpawnSite <= 25) {pos = new Vector(Math.round(Math.random() * CANVAS.width), spawn); direction = "top"}
    else if (randomSpawnSite <= 50) {pos = new Vector(CANVAS.width + Math.abs(spawn), Math.round(Math.random() * CANVAS.height)); direction = "right"}
    else if (randomSpawnSite <= 75) {pos = new Vector(Math.round(Math.random() * CANVAS.width), CANVAS.height + Math.abs(spawn)); direction = "bottom"}
    else {pos = new Vector(spawn, Math.round(Math.random() * CANVAS.height)); direction = "left"}

    var deltas = new Array(4)
    for (var i = 0; i < CORNERS.length; i++) {
        deltas[i] = Vector.delta(pos, CORNERS[i]);
        //console.log(i + ": " + deltas[i].length))
    }
    deltas.sort((a, b) => a.length - b.length)


    var angle = Vector.angle(deltas[0], deltas[1])
    var limitedAngle = angle * 0.8;
    var velocity = null;

    switch (direction) {
        case "top":
            if (pos.x + deltas[0].x < pos.x + deltas[1].x) {
                velocity = Vector.rotate(deltas[0], angle * 0.1 + limitedAngle * Math.random())
            }
            else {
                velocity = Vector.rotate(deltas[1], angle * 0.1 + limitedAngle * Math.random())
            }
            break;
        case "right":
            if (pos.y + deltas[0].y < pos.y + deltas[1].y) {
                velocity = Vector.rotate(deltas[0], angle * 0.1 + limitedAngle * Math.random())
            }
            else {
                velocity = Vector.rotate(deltas[1], angle * 0.1 + limitedAngle * Math.random())
            }
            break;
        case "bottom":
            if (pos.x + deltas[0].x > pos.x + deltas[1].x) {
                velocity = Vector.rotate(deltas[0], angle * 0.1 + limitedAngle * Math.random())
            }
            else {
                velocity = Vector.rotate(deltas[1], angle * 0.1 + limitedAngle * Math.random())
            }
            break;
        case "left":
            if (pos.y + deltas[0].y > pos.y + deltas[1].y) {
                velocity = Vector.rotate(deltas[0], angle * 0.1 + limitedAngle * Math.random())
            }
            else {
                velocity = Vector.rotate(deltas[1], angle * 0.1 + limitedAngle * Math.random())
            }
            break;
    }

    radius = Math.random() * 20 + 5;
    return new Stone(
        pos.x, pos.y,
        Math.round(radius), 
        Vector.scale(velocity, Math.sqrt((2*200*level)/(radius*radius)))
    )
}

function init() {
    drawBackground();

    //fill stones
    stones = new Array(ASTEROID_COUNT)
    for (var i = 0; i < stones.length; i++) {
        stones[i] = createStone();
    }
}

function renderFrame() {
    drawBackground();

    //render asteroids
    stones.forEach(stone => {
        stone.render();

        if (enableMouseLines) {
            CTX.beginPath();
            CTX.fillStyle = 'white';
            CTX.lineWidth = 1;
            CTX.moveTo(stone.x, stone.y)
            CTX.lineTo(mouseX, mouseY)
            CTX.stroke();
        }
    })

    //render shuttle
    if (showShuttle) {
        if (hit) {
            if (!byHitVisible) {
                if (!hitAnimationTimeout) {
                    hitAnimationTimeout = true;
                    setTimeout(() => {byHitVisible = true; hitAnimationTimeout = false}, 300)
                }
                starfighter.render(onlyShots=true)
            }
            else {
                if (!hitAnimationTimeout) {
                    hitAnimationTimeout = true;
                    setTimeout(() => {byHitVisible = false; hitAnimationTimeout = false}, 300)
                }
                starfighter.render()
            }
        }
        else {
            starfighter.render()
        }
        
    }

    //render text in game
    if (game) {
        CTX.font = '20px monospace'
        CTX.fillStyle = 'white';
        CTX.fillText("Points: " + points, 20,20+24);

        var heartString = "";
        for (var i = 0; i < hearts; i++) {heartString+="\u2764"}
        CTX.fillText(heartString, 20,68);
        
        CTX.font = '14px monospace';
        CTX.fillText("Multiplier: " + Math.round(level*100)/100 + "x", 20, CANVAS.height - 20);
    }
    

    //menu
    if (menu) {
        if (startSide) {
        renderMenu()
        }

        if (settings) {
            renderSettings()
        }
    }
    
}

function calcForNextFrame() {

    //calculation for each asteroid
    for (var i = 0; i < stones.length; i++) {
        stones[i].x = stones[i].x + stones[i].vector.x;
        stones[i].y = stones[i].y + stones[i].vector.y;


        //collision with walls
        if (stones[i].x <= -200
            || stones[i].x >= CANVAS.width + 200 
            || stones[i].y <= -200
            || stones[i].y >= CANVAS.height + 200) 
        {
            stones[i] = createStone()
        }
    } 

    if (showShuttle) {
        delta = Vector.delta(starfighter.pos, getMouseVector())
        if (delta.length >= 15) {
            starfighter.fly(0.05* delta.length)
        }
        starfighter.lookAt(getMouseVector())

        //collision with asteroid and shuttle
        stones.forEach(stone => {
            if (stone.radius + 10 >= Vector.delta(stone.getVector(), starfighter.pos).length) {
                if (!hit) {hearts--}
                if (hearts == 0) {
                    shouldRender = false;
                    gameover = true;
                }
                hit = true
                setTimeout(() => hit = false, HIT_TIMEOUT)
            }
        })
    }

    if (game) {
        level += 0.0005
    }
    
    //create asteroid per level
    if (Number.parseInt(level) == ASTEROID_COUNT - 4 && !startSide && !settings) {
        stones.push(createStone())
        ASTEROID_COUNT++;
    }

    //collision with asteroid and shot
    var newStones = new Array()
    stones.forEach(stone => {
        var collision = false;
        var newShots = []
        starfighter.shots.forEach(shot => {
            
            if(stone.radius >= Vector.delta(stone.getVector(), Vector.add(shot.pos, shot.vector)).length) {
                collision++;
            } 
            else {
                newShots.push(shot)
            }
        });
        starfighter.shots = newShots;
        if (collision) {
            newStones.push(createStone())
            if (stone.radius < 3) {points += Math.round(80*level)}
            else if (stone.radius < 8) {points += Math.round(30*level)}
            else if (stone.radius < 14) {points += Math.round(15*level)}
            else {points += Math.round(5*level)}
            
        } 
        else {
            newStones.push(stone)
        }
    })
    stones = newStones
    
}

function startRendering() {
    
    if (shouldRender) {
        renderFrame();
        calcForNextFrame();
    }

    //menu
    if (menu) {
        if (startSide) {
        renderMenu()
        }

        if (settings) {
            renderSettings()
        }
    }

    //game
    if (game) {
        if (gameover) {
            renderFrame();
            renderGameover();
        }

        if (pause) {
            renderFrame();
            renderPause();
        }
    }

    interval = setTimeout(startRendering, 1000/FPS)
}

//listener
function mouseOver(event) {
    mouseX = event.x;
    mouseY = event.y;
}

function mouseClick(event) {
    if (menu) {
        if (startSide) {
            if (((CANVAS.width - menuWidth)/2) + 45 < mouseX 
                && mouseX < ((CANVAS.width - menuWidth)/2) + 147
                && mouseY < ((CANVAS.height - menuHeight)/2) + 25 
                && mouseY > ((CANVAS.height - menuHeight)/2) + 5) 
            {
                startGame() 
            }

            if (CANVAS.width/2 - 38 < mouseX 
                && mouseX < CANVAS.width/2 + 38 
                && CANVAS.height/2 - 20 < mouseY 
                && mouseY < CANVAS.height/2) 
            {
                showSettings()
            }
        }
    }

    if (settings) {
        settings_radio.forEach(radio => {
            if (radio.mouseHover()) {
                radio.onClick()
            }
        })
        settings_button.forEach(btn => {
            if (btn.mouseHover()) {
                btn.onClick()
            }
        })
        
    }
    
    if (gameover) {
        if (CANVAS.width/2 - 22 < mouseX 
        && mouseX < CANVAS.width/2 + 22 
        && CANVAS.height/2 + 20 < mouseY 
        && mouseY < CANVAS.height/2 + 40){
            gameover = false;
            showMenu()
        }

        if (CANVAS.width/2 - 38 < mouseX 
        && mouseX < CANVAS.width/2 + 38 
        && CANVAS.height/2 + 45 < mouseY 
        && mouseY < CANVAS.height/2 + 65) {
            startGame()
        }
    }
     

    if (showShuttle && !gameover ) {
        starfighter.shot()
    }
}

function keyDown(event) {
    switch (event.key) {
        case "l": (enableMouseLines ? enableMouseLines = false : enableMouseLines = true); break;
        case "i": (enableDebugMode ? enableDebugMode = false : enableDebugMode = true); break;
        case "f": 
            switchFullscreen()
            break;
        case " ": (!gameover ? starfighter.shot() : null); break;
        case "Escape": 
            if (game && !gameover) {
                if (shouldRender) {shouldRender = false; pause = true}else{shouldRender = true; pause = false}
            } break;
    }
}

function switchFullscreen() {
    if (fullScreen) {
        fullScreen = false
        CANVAS.width = 600;
        CANVAS.height = 600;
    }
    else {
        fullScreen = true 
        var html = document.getElementsByTagName('html')[0]
        CANVAS.width = html.clientWidth;
        CANVAS.height = html.clientHeight;
    }
}

function test() {
    gameover = true
    setInterval(() => {
        drawBackground()
        renderSettings()

    }, 1000/60)
}

function drawVector(origin, vector, width=1) {
    CTX.beginPath();
    CTX.lineWidth = width;
    CTX.strokeStyle = "white";
    CTX.moveTo(origin.x, origin.y);
    nextPoint = Vector.add(origin, vector);
    CTX.lineTo(nextPoint.x, nextPoint.y);
    CTX.stroke();
}

function renderPause() {
    CTX.fillStyle = 'white';
    CTX.font = '50px monospace';
    
    CTX.fillText('PAUSE', CANVAS.width/2 - 69, CANVAS.height/2 + 15)
}

function renderGrid() {
    CTX.strokeStyle = 'white';
    CTX.lineWidth = 1;
    CTX.beginPath()
    CTX.moveTo(CANVAS.width/2, 0)
    CTX.lineTo(CANVAS.width/2, CANVAS.height)
    CTX.moveTo(0, CANVAS.height/2)
    CTX.lineTo(CANVAS.width, CANVAS.height/2)
    CTX.stroke()
}

function renderCountdown(count) {
    drawBackground();
    CTX.font = '100px monospace'
    CTX.fillStyle = 'white'
    if (count == 0) {
        CTX.font = '80px monospace'
        CTX.fillText("START", (CANVAS.width/2) - 110, (CANVAS.height/2) + 25)
        setTimeout(() => {shouldRender = true; showShuttle = true}, 1000)
    }
    else {
        CTX.fillText(count, (CANVAS.width/2) - 34, (CANVAS.height/2) + 25)
    }
    if (0 < count) {
        setTimeout(() => renderCountdown(count - 1), 1000)
    }
}

function startGame() {
    startSide = false;
    shouldRender = false;
    hearts = MAX_HEARTS;
    points = 0;
    game = true;
    gameover = false;
    level = 1
    ASTEROID_COUNT = 5
    init()
    renderCountdown(3)
}

function renderGameover() {

    //title
    CTX.fillStyle = 'red'
    CTX.font = '70px monospace'
    CTX.fillText('GAME OVER', CANVAS.width/2 - 175, CANVAS.height/2 + 13)

    //options
    CTX.font = '20px monospace'
    CTX.fillStyle = 'white';
    (CANVAS.width/2 - 22 < mouseX && mouseX < CANVAS.width/2 + 22 && CANVAS.height/2 + 20 < mouseY && mouseY < CANVAS.height/2 + 40? CTX.fillStyle = 'red' : null) 
    CTX.fillText('MENU', CANVAS.width/2 - 22, CANVAS.height/2 + 40)

    CTX.fillStyle = 'white';
    (CANVAS.width/2 - 38 < mouseX && mouseX < CANVAS.width/2 + 38 && CANVAS.height/2 + 45 < mouseY && mouseY < CANVAS.height/2 + 65? CTX.fillStyle = 'red' : null)
    CTX.fillText('RESTART', CANVAS.width/2 - 38, CANVAS.height/2 + 65)
}

function showMenu() {
    if (!settings) {
        init()
    }
    starfighter.pos = new Vector(CANVAS.width/2, CANVAS.height/2)
    game = false
    showShuttle = false
    startSide = true
    shouldRender = true
    settings = false
}

function showSettings() {
    startSide = false
    settings = true
}

function renderMenu() {
    var menuWidth = 300;
    var menuHeight = 100;

    CTX.fillStyle = 'white'

    //title
    CTX.font = '30px arial'
    CTX.fillText('SPACE INVADOR', ((CANVAS.width - 244)/2), ((CANVAS.height - menuHeight)/2) - 50)

    //options
    CTX.fillStyle = '#555'
    CTX.fillRect((CANVAS.width - menuWidth)/2, (CANVAS.height - menuHeight)/2 , menuWidth, menuHeight)
    CTX.font = '20px arial'
    CTX.fillStyle = 'white'

    if (((CANVAS.width - menuWidth)/2) + 97 < mouseX 
    && mouseX < ((CANVAS.width - menuWidth)/2) + 197 
    && mouseY < ((CANVAS.height - menuHeight)/2) + 25 
    && mouseY > ((CANVAS.height - menuHeight)/2) + 5) {
        CTX.fillStyle = "red"
    }
    CTX.fillText('Start Game', ((CANVAS.width - menuWidth)/2) + 97, ((CANVAS.height - menuHeight)/2) + 25)

    CTX.fillStyle = 'white';
    (CANVAS.width/2 - 38 < mouseX && mouseX < CANVAS.width/2 + 38 && CANVAS.height/2 - 20 < mouseY && mouseY < CANVAS.height/2? CTX.fillStyle = 'red' : null)
    CTX.fillText('Settings', CANVAS.width/2 - 38, CANVAS.height/2)
}

function renderSettings() {
    CTX.fillStyle = '#555'
    CTX.strokeStyle = 'white'
    CTX.font = '30px monospace'
    CTX.lineWidth = 1;

    settings_radio = [new Radio(new Vector(CANVAS.width/2 + 60, CANVAS.height/2 - 58), 20, 20, fullScreen, switchFullscreen)]
    settings_button = [new Button('Back', new Vector(CANVAS.width/2 - 24, CANVAS.height/2 - 10), 48, 20, showMenu)]

    CTX.fillRect(CANVAS.width/2 - 150, CANVAS.height/2 - 65, 300, 100)
    CTX.fillStyle = 'white';

    CTX.fillText("Settings", CANVAS.width/2 - 66, CANVAS.height/2 - 80)
    CTX.font = '20px arial'
    CTX.fillText('Full-screen', CANVAS.width/2 - 90, CANVAS.height/2 - 40);

    settings_radio.forEach(radio => radio.render())
    settings_button.forEach(btn => btn.render())
}

function main() {
    // test(); 
    init();
    startRendering();
}

main()