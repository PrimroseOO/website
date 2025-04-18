let canvas;
let prev_Width = document.body.scrollWidth + 10;
let prev_Height = document.body.scrollHeight + 100;

function setup() {

    canvas = createCanvas(prev_Width, prev_Height); 
    canvas.position(0, 0); 
    canvas.style("z-index", "-1");
    background(0,0,0,0);
    draw_Textbox();
}

function draw_Textbox() {
   
    let elements = document.querySelectorAll(".content-div");
      
    elements.forEach((element) => {

        if (element.classList.contains("noTextbox")) return;

        const rect = element.getBoundingClientRect();
        let x1 = rect.left + window.scrollX;
        let y1 = rect.top + window.scrollY;
        let x2 = rect.right + window.scrollX;
        let y2 = rect.bottom + window.scrollY;  
        textbox_Draw(x1,y1,x2,y2);

    });

    function textbox_Draw(x1, y1, x2, y2) {

        let w = x2 - x1;
        let h = y2 - y1;
    
        stroke(171,191,255);
        strokeWeight(4);
        fill(230, 240, 255);
        rect(x1,y1,w,h);
    
        strokeWeight(2);
        line(x1+6, y2-6, x2-6, y2-6);
        line(x1+6, y1+6, x1+6, y2-6);
        line(x1+6, y1+6, x2-6, y1+6);
        line(x2-6, y1+6, x2-6, y2-6);
    
        function flower(x, y) {
      
            strokeWeight(0.7);
            stroke(255,255,255)
            fill(171,191,225);
      
            //bottom
            quad(x,y,x-5,y+1,x-5,y+6,x,y+5);
            quad(x,y,x+5,y+1,x+5,y+6,x,y+5);
    
            //top
            quad(x,y,x-5,y+1,x-7,y-3,x-3,y-4);
            quad(x,y,x+5,y+1,x+7,y-3,x+3,y-4);
    
            //point
            quad(x,y,x-3,y-4,x,y-7.5,x+3,y-4);
    
            stroke(255,255,255,100);
            line(x,y,x,y-7.5);
            line(x,y,x-7,y-3);
            line(x,y,x+7,y-3);
            line(x,y,x-5,y+6);
            line(x,y,x+5,y+6);
      
            fill(245, 245, 40, 185);
            circle(x,y,4);
        }
    
        flower(x1+5, y1+5);
        flower(x1+5, y2-5);
        flower(x2-5, y1+5);
        flower(x2-5, y2-5);
    }
}

function windowResized() {

    let current_Width = document.body.scrollWidth;
    let current_Height = document.body.scrollHeight;

    if (current_Width !== prev_Width || current_Height !== prev_Height) setup();

    prev_Width = current_Width + 10;
    prev_Height = current_Height + 100;
}


