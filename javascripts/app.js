$(window).load(function() {
  window.colorTracker = {
    $src: $('#video'),
    currentDominantColor: {'r': 0, 'g': 0, 'b': 0},
    nextDominantColor: {
      n: {'r': 0, 'g': 0, 'b': 0},
      s: {'r': 0, 'g': 0, 'b': 0},
      e: {'r': 0, 'g': 0, 'b': 0},
      w: {'r': 0, 'g': 0, 'b': 0}
    },
    init : function() {
      this.videoOffset = this.$src.offset(),
      self = this;
      // this.$src.ontimeupdate = this.
      self.CanvasVideo.prototype.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
      };
      self.CanvasVideo.prototype.update = function(imageData) {
        this.context.putImageData(imageData, 0, 0);
      };
      self.CanvasVideo.prototype.getPixelCount = function() {
        return this.width * this.height;
      };
      self.CanvasVideo.prototype.getImageData = function() {
        return this.context.getImageData(0, 0, this.width, this.height);
      };
      self.CanvasVideo.prototype.removeCanvas = function() {
        $(this.canvas).remove();
      };

      $('#canvas').boxer({
        start: function(){
          if ($('.tracking-point').length > 1) return false;
        },
        stop: function(event, ui) {
          var offset = ui.box.offset();
          self.dimensions = { 'w': ui.box.width(), 'h' : ui.box.height() };

          var dominantColor = self.getDominantColor(
            self.$src, offset.left - self.videoOffset.left, offset.top - self.videoOffset.top, self.dimensions.w, self.dimensions.h,
            offset.left - self.videoOffset.left, offset.top - self.videoOffset.top, self.dimensions.w, self.dimensions.h);

          $.each(dominantColor, function(key, value) {
            self.currentDominantColor[key] = value;
          });

          ui.box.css({ border: '1px dashed white', background: 'rgba(255,69,0, 0.5)', padding: '0.5em' })
            .append('x:' + offset.left + ', y:' + offset.top)
            .append('<br>')
            .append('w:' + ui.box.width() + ', h:' + ui.box.height());
          ui.box.attr('id', 'trackingPoint' + Math.floor(Math.random(24)*10000)).addClass('tracking-point');

          console.log('Dominant Color: r: ' + dominantColor.r + ' g: ' + dominantColor.g + ' b: ' + dominantColor.b);
          $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');

          self.setCardinalColors(self);
          self.$src[0].play();
        }
      });
    },
    CanvasVideo: function(video, sx, sy, sw, sh, dx, dy, dw, dh) {
      // If jquery object is passed in, get html element
      this.vidEl = (video.jquery)? video[0]: video;

      this.canvas = document.createElement('canvas'),
        this.context = this.canvas.getContext('2d');

      document.body.appendChild(this.canvas);

      this.width = this.canvas.width = $(this.vidEl).width(),
      this.height = this.canvas.height = $(this.vidEl).height();

      this.context.drawImage(this.vidEl, sx, sy, sw, sh, dx, dy, dw, dh);
    },
    getDominantColor: function(sourceVideo, sx, sy, sw, sh, dx, dy, dw, dh) {

      var palette = [];

      // Create custom CanvasVideo object
      var image = new this.CanvasVideo(sourceVideo, sx, sy, sw, sh, dx, dy, dw, dh),
        imageData = image.getImageData(),
        pixels = imageData.data,
        pixelCount = image.getPixelCount();

      // Store the RGB values in an array format suitable for quantize function
      var pixelArray = [];
      for (var i = 0; i < pixelCount; i++) {
        // If pixel is mostly opaque and not white
        if(pixels[i*4+3] >= 125){
          if(!(pixels[i*4] > 250 && pixels[i*4+1] > 250 && pixels[i*4+2] > 250)){
              pixelArray.push( [pixels[i*4], pixels[i*4+1], pixels[i*4+2]]);
          }
        }
      };

      // Send array to quantize function which clusters values
      // using median cut algorithm
      var cmap = MMCQ.quantize(pixelArray, 5);
      var newPalette = cmap.palette();

      // Clean up
      image.removeCanvas();

      return {r: newPalette[0][0], g: newPalette[0][1], b: newPalette[0][2]};
    },
    setCardinalColors: function(self) {
      var $target = $('.tracking-point'),
      offset = $target.offset();
      self.cardinal = { n: {top: -10, left: 0},
                   s: {top: 10, left: 0},
                   e: {top: 0, left: 10},
                   w: {top: 0, left: -10}};

      $.each(self.cardinal, function(key, value){
        var values = self.getDominantColor(self.$src, offset.left - self.videoOffset.left + self.cardinal[key].left,
          offset.top - self.videoOffset.top + self.cardinal[key].top, self.dimensions.w, self.dimensions.h,
          offset.left - self.videoOffset.left + self.cardinal[key].left, offset.top - self.videoOffset.top + self.cardinal[key].top,
          self.dimensions.w, self.dimensions.h);

        self.nextDominantColor[key].r = values.r;
        self.nextDominantColor[key].g = values.g;
        self.nextDominantColor[key].b = values.b;
      });
    },
    closestCardinalShift : function() {
      var target = this.currentDominantColor,
        diff = cand = 255,
        north = this.nextDominantColor.n,
        south = this.nextDominantColor.s,
        east = this.nextDominantColor.e,
        west = this.nextDominantColor.w,
        nDistance = Math.sqrt((north.r - target.r)^2 + (north.g - target.g)^2 + (north.b - target.b)^2),
        sDistance = Math.sqrt((south.r - target.r)^2 + (south.g - target.g)^2 + (south.b - target.b)^2),
        eDistance = Math.sqrt((east.r - target.r)^2 + (east.g - target.g)^2 + (east.b - target.b)^2),
        wDistance = Math.sqrt((west.r - target.r)^2 + (west.g - target.g)^2 + (west.b - target.b)^2),
        distanceArr = [nDistance, sDistance, eDistance, wDistance];

      for (var dist in distanceArr) {
        var offset = Math.abs(distanceArr[dist] - target);
        if (offset < diff) {
          diff = offset;
          cand = dist;
        }
      }

      if (cand = 'nDistance') return 'north';
      if (cand = 'sDistance') return 'south';
      if (cand = 'eDistance') return 'east';
      if (cand = 'wDistance') return 'west';

    },
    rgb2hsv : function(r,g,b) {
      var computedH = 0,
        computedS = 0,
        computedV = 0,
        r = parseInt( (''+r).replace(/\s/g,''),10 ),
        g = parseInt( (''+g).replace(/\s/g,''),10 ),
        b = parseInt( (''+b).replace(/\s/g,''),10 );

      if ( r==null || g==null || b==null ||
         isNaN(r) || isNaN(g)|| isNaN(b) ) {
        console.log('Please enter numeric RGB values!');
        return;
      }
      if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
        console.log('RGB values must be in the range 0 to 255.');
        return;
      }
      r=r/255; g=g/255; b=b/255;
      var minRGB = Math.min(r,Math.min(g,b)),
        maxRGB = Math.max(r,Math.max(g,b));

      // Black-gray-white
      if (minRGB==maxRGB) {
        computedV = minRGB;
        return [0,0,computedV];
      }

      // Colors other than black-gray-white:
      var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r),
        h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
      computedH = 60*(h - d/(maxRGB - minRGB));
      computedS = (maxRGB - minRGB)/maxRGB;
      computedV = maxRGB;
      return [computedH,computedS,computedV];
    }
  };
  colorTracker.init();

  colorTracker.$src[0].bind('ontimeupdate', function() {
    var $trackingPoint = $('.tracking-point'),
      offset = $trackingPoint.offset();
    self.dimensions = { 'w': $trackingPoint.width(), 'h' : $trackingPoint.height() },
    prevDominantColor = colorTracker.currentDominantColor;

    var dominantColor = self.getDominantColor(
      colorTracker.$src, offset.left - colorTracker.videoOffset.left, offset.top - colorTracker.videoOffset.top, colorTracker.dimensions.w, colorTracker.dimensions.h,
      offset.left - colorTracker.videoOffset.left, offset.top - colorTracker.videoOffset.top, colorTracker.dimensions.w, colorTracker.dimensions.h);

    $.each(dominantColor, function(key, value) {
      colorTracker.currentDominantColor[key] = value;
    });

    ui.box.css({ border: '1px dashed white', background: 'rgba(255,69,0, 0.5)', padding: '0.5em' })
      .append('x:' + offset.left + ', y:' + offset.top)
      .append('<br>')
      .append('w:' + ui.box.width() + ', h:' + ui.box.height());
    ui.box.attr('id', 'trackingPoint' + Math.floor(Math.random(24)*10000)).addClass('tracking-point');

    console.log('Dominant Color: r: ' + dominantColor.r + ' g: ' + dominantColor.g + ' b: ' + dominantColor.b);
    $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');

    self.setCardinalColors(self);
  });
});
