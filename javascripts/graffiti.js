var Graffiti = {
  STROKE_WIDTH: 5,
  OPACITY: 0.7,
  
  MODES: ['waves', 'stackLetters'],
  SURFACE_PHOTOS: [
    {
      src: 'http://farm4.static.flickr.com/3055/2311918302_93a0bfc270_b.jpg',
      width: 1024,
      height: 679
    },
    {
      src: 'http://farm4.static.flickr.com/3575/3351124889_7b16399c2b_o.jpg',
      width: 700,
      height: 525
    }
  ],
  
  paper: undefined,
  backgroundImage: undefined,
  sourceText: 'Fresh Ed',
  textObj: undefined,
  drips: undefined,
  stackedPaths: [],
  mode: 'stackLetters',
  
  init: function(){
    var $window = $(window);
    this.paper = Raphael(0, 0, $window.width(), $window.height());
    
    var background = this.SURFACE_PHOTOS[0];
    this.backgroundImage = this.paper.image(background.src, 0, 0, this.paper.width, this.paper.height);
    
    this.redrawText();
    this.drips = this.paper.set()
    this.randomDrip(this.textObj);
    
    this.mode = this.getRandomElt(this.MODES);
    
    $(window).click(function(e){
      Graffiti.onClick.call(Graffiti, e.pageX, e.pageY);
    });
  },
  
  stackPath: function(path){
    // path.attr({'fill-opacity': 1});
    
    var shiftLeft = true,
      clone = path.clone();
    
    clone.insertBefore(path);
    clone
      .translate((shiftLeft ? -10 : 10), 20)
      .scale(1.2, 1.2)
      .attr({
        fill: this.colorStr(this.randomColor()),
        stroke: 'black'
      });
    
    return clone;
  },
  
  onClick: function(mouseX, mouseY){
     switch (this.mode){
      case 'waves':
        var i = this.getRandomIndex(this.textObj),
          letter = this.textObj[i],
          stackSet = this.getStackSet(i);
        
        var letterToStack = _(stackSet).last() || letter,
          clone = this.stackPath(letterToStack);
        
        clone.insertBefore(letterToStack);
        this.stackedPaths[i].push(clone);
        
        // a bit of a hack to keep the original text and drips on top
        this.textObj.toFront();
        this.drips.toFront();
        break;
      case 'stackLetters':
        var i = this.getRandomIndex(this.textObj),
          letter = this.textObj[i],
          stackSet = this.getStackSet(i);
        
        var letterToStack = _(stackSet).last() || letter,
          clone = this.stackPath(letterToStack);
        
        clone.insertBefore(letterToStack);
        this.stackedPaths[i].push(clone);
        
        // a bit of a hack to keep the original text and drips on top
        this.textObj.toFront();
        this.drips.toFront();
        break;
    }
  },
  
  getStackSet: function(i){
    var stackSet = this.stackedPaths[i];
    
    // create the stack set if it doesn't exist already
    if (!stackSet){
      stackSet = this.paper.set();
      stackSet.insertBefore(this.textObj);
      this.stackedPaths[i] = stackSet;
    }
    
    return stackSet;
  },
  
  getRandomIndex: function(ary){
    return Math.floor(Math.random() * ary.length);
  },
  
  getRandomElt: function(ary){
    var i = this.getRandomIndex(ary);
    return ary[i];
  },
  
  getPath: function(obj){
    return obj.getSubpath(0, obj.getTotalLength());
  },
  
  // animation technique found here: http://stackoverflow.com/questions/4631019/how-to-draw-a-vector-path-progressively-raphael-js
  makeWave: function(startX, startY, endX, endY){
    var vRad = endY - startY,
      hRad = Math.abs(endX - startX),
      // Ramanujan approximation
      circumference = this.getCircumference(hRad, vRad),
      // scale the animation time by the size of the wave, so that the
      // speed is somewhat consistent
      fallingTime = circumference / 4,
      waveColor = [Math.random()*0, Math.random()*50 + 205, Math.random()*50 + 205],
      offsetDest;
    
    if (endX < startX){
      // animate counter-clockwise
      offsetDest = circumference + (circumference / 4);
    } else {
      // animate clockwise
      offsetDest = circumference - (circumference / 4);
    }
    
    // The arc of the ellipse starts at the 3 o'clock point, so to
    // acheive the animation coming from the top, flip the radii, then
    // rotate three-quarters clockwise to get the intended shape.
    var ellipse = this.paper.ellipse(startX, endY, vRad, hRad);
    ellipse
      .attr({
        rotation: 270,
        fill: this.colorStr(waveColor),
        'fill-opacity': 0,
        stroke: 'white',
        'stroke-width': 1
      })
      .animate({'stroke-width': 10}, fallingTime);
    
    $(ellipse.node)
      .css('stroke-dasharray', circumference + ',' + circumference)
      .css('stroke-dashoffset', circumference)
      .animate({'stroke-dashoffset': offsetDest}, fallingTime, 'linear')
      .animate({'fill-opacity': 0.5}, 500);
      
    return ellipse;
  },
  
  // Ramanujan approximation for an ellipse
  getCircumference: function(rx, ry){
    return Math.PI * (3*(rx + ry) - Math.sqrt((3*rx + ry) * (rx + (3*ry))))
  },
  
  randomDrip: function(obj){
    if (obj.type === 'set'){
      for (var i = 0; i < obj.length; i++){
        var item = obj[i];
        this.randomDrip(item);
      }
    } else {
      var pathLength, start;
      
      if (obj.type === 'ellipse'){
        pathLength = this.getCircumference(obj.attrs.rx, obj.attrs.ry);
        // TODO start = {x: , y: };
      } else {
        pathLength = obj.getTotalLength();
        start = obj.getPointAtLength( Math.random() * pathLength );
      }
      
      var strokeWidth = obj.attrs['stroke-width'] || this.STROKE_WIDTH,
        strokeColor = obj.attrs.stroke,
        drip = this.paper
          .rect(start.x, start.y, strokeWidth, strokeWidth, strokeWidth/2)
          .attr({
            fill: strokeColor,
            stroke: strokeColor
          }).
          animate({height: 100 * Math.random()}, 15000, '>');
      
      this.drips.push(drip);
    }
  },
  
  redrawText: function(){
    var font = this.paper.getFont("Amsterdam Graffiti", 800),
      textColor = this.randomColor(),
      strokeColor;
    
    if ((textColor[0] + textColor[1] + textColor[2]) > (255 * 3 / 2)){
      strokeColor = 'black';
    } else {
      strokeColor = 'white';
    }
    
    this.textObj = this.paper
      .print(this.paper.width*0.1, this.paper.height/2, this.sourceText, font, 300)
      .attr({
        fill: this.colorStr(textColor),
        'fill-opacity': this.OPACITY,
        stroke: strokeColor,
        'stroke-width': this.STROKE_WIDTH,
      });
  },
  
  randomColor: function(){
    return [ Math.random()*255, Math.random()*255, Math.random()*255 ];
  },
  
  colorStr: function(rgb){
    return 'rgb(' + rgb.join(',') + ')';
  }
};

$(function(){
  Graffiti.init();
});
