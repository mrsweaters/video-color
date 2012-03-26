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
    init : function(){
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
        }
      });
    },
    CanvasVideo: function(video, sx, sy, sw, sh, dx, dy, dw, dh){
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
      cardinal = { n: {top: -10, left: 0},
                   s: {top: 10, left: 0},
                   e: {top: 0, left: 10},
                   w: {top: 0, left: -10}};

      $.each(cardinal, function(key, value){
        var values = self.getDominantColor(self.$src, offset.left - self.videoOffset.left + cardinal[key].left,
          offset.top - self.videoOffset.top + cardinal[key].top, self.dimensions.w, self.dimensions.h,
          offset.left - self.videoOffset.left + cardinal[key].left, offset.top - self.videoOffset.top + cardinal[key].top,
          self.dimensions.w, self.dimensions.h);

        self.nextDominantColor[key].r = values.r;
        self.nextDominantColor[key].g = values.g;
        self.nextDominantColor[key].b = values.b;
      });
    }
  };
  colorTracker.init();
});
