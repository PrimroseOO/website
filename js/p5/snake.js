gi = {
    a_Pos: [],
    s_Pos: [[0, 0]],
    grid: [],
    direction: undefined,
    state: undefined,
    s_Len: 1
}
  
for (let i = 0; i < 16; i++) {
    gi.grid[i] = i * 25;
}
  
gi.s_Pos[0][0] = gi.grid[Math.floor(Math.random() * 16)]
gi.s_Pos[0][1] = gi.grid[Math.floor(Math.random() * 16)]
gi.a_Pos[0] = gi.grid[Math.floor(Math.random() * 16)]
gi.a_Pos[1] = gi.grid[Math.floor(Math.random() * 16)]
  
function setup() {
    
    frameRate(30);
    createCanvas(400, 400);
    background(0);
    apple(gi.a_Pos[0], gi.a_Pos[1])
    draw()
  
}
  
function draw() {
    
    if (frameCount % 10 != 0) return;
    if (gi.state == "gameover") return;
      
    let x = gi.s_Pos[0][0];
    let y = gi.s_Pos[0][1];
  
    if (gi.direction == "left") {
      x -= 25;
      if (x < 0) gameover();
    } else if (gi.direction == "right") {
      x += 25;
      if (x > 375) gameover();
    }  else if (gi.direction == "up") {
      y -= 25;
      if (y < 0) gameover();
    }  else if (gi.direction == "down") {
      y += 25;
      if (y > 375) gameover();
    }
      
    self_Collision(x, y)
    background(0)
    apple();
    gi.s_Pos.unshift([x, y])
    collision();
  
    for (let i = 0; i < gi.s_Len; i++) {
  
      if (i == 0) {
        fill(255)
      } else {
        fill(200);
      }
  
      rect(gi.s_Pos[i][0], gi.s_Pos[i][1], 25, 25)
  
    }
    
}

function apple(x = gi.a_Pos[0], y = gi.a_Pos[1]) {
  
    for (let i = 0; i < gi.s_Pos.length; i++) {
  
      if (x == gi.s_Pos[i][0] && y == gi.s_Pos[i][1]) {
  
        apple(random(gi.grid), random(gi.grid))
        return;
  
      }
  
    }
  
    gi.a_Pos = [x, y];
    fill(255, 0, 0);
    rect(x, y, 25, 25);
  
}

function keyPressed() {
    
    if (key === "a") {
      gi.direction = "left"
    } else if (key === "d") {
      gi.direction = "right"
    } else if (key === "w") {
      gi.direction = "up"
    } else if (key === "s") {
      gi.direction = "down"
    }
    
    return false;
    
}
   
function gameover() {
    
    console.log("gameover");
    console.log(`score: ${(gi.s_Len - 1) * 100}`)
    gi.state = "gameover";
    return;
    
}
  
function collision() {
  
    if (gi.s_Pos[0][0] == gi.a_Pos[0] && gi.s_Pos[0][1] == gi.a_Pos[1]) {
  
        gi.s_Len++
        background(0);
        apple(random(gi.grid), random(gi.grid));
  
    }
  
    return;
  
}
  
function self_Collision(x, y) {
  
    if (gi.direction == undefined) return;
  
    gi.s_Pos = gi.s_Pos.slice(0, gi.s_Len);
  
    for (let i = 0; i < gi.s_Pos.length; i++) {
  
      if (x == gi.s_Pos[i][0] && y == gi.s_Pos[i][1]) {
  
        gameover();
  
      }
  
    }
  
    return;
  
}