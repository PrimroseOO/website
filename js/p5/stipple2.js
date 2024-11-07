//stippling-4.png

function setup() {

  createCanvas(400, 400);
  background(255,255,255);
  stipple();

}

function stipple() {
  
  for (let x = 0; x < 400; x++){
    
    for (let y = 0; y < 400; y++) {
      
      //draw for last 5 pixels in every 20 pixels
      //
      if (x % 20 > 14 && y % 20 > 14) {
         
        let a; //init here for correct scope

        if (x + y < 400) {

          a = (x + y - 200) / 200 * 255

        } else {

          a = (x + y - 600) / 200 * 255

        }


        stroke(171, 191, 225, abs(a)); //sets color, RGBA by default
        point(x, y);
        
      }
    }
  }
}