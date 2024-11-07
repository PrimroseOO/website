//background stippling of homepage

function setup() {

  createCanvas(400, 400);
  background(255,255,255)
  stipple();
  
}

function stipple() {
  
  for (let x = 0; x < 400; x++){
    
    for (let y = 0; y < 400; y++) {
      

      if (x % 20 > 14 && y % 20 > 14) {
        
        let a = ((x % 20 - 20) * 25.5) + ((y % 20 - 20) * 25.5);
        
        stroke(171, 191, 225, abs(a));
        point(x, y);
        
      }
    }
  } 
}