/*
  ColorTracker v0.1
  Copyright (C) 2012 by Jordan Humphreys. All Rights Reserved.
  http://jordanhumphreys.com
*/
$(window).load(function() {
  var colorTracker = {
    $src: $('#video'),
    currentDominantColor: {'r': 0, 'g': 0, 'b': 0},
    nextDominantColor: {
      n: {'r': 0, 'g': 0, 'b': 0},
      s: {'r': 0, 'g': 0, 'b': 0},
      e: {'r': 0, 'g': 0, 'b': 0},
      w: {'r': 0, 'g': 0, 'b': 0}
    },
    cardinal : $.noop,
    initialDominantColor : $.noop,
    interval : null,
    prevDistanceArr : [],
    init : function() {
      this.videoOffset = this.$src.offset(),
      self = this;

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

          // console.log('Dominant Color: r: ' + dominantColor.r + ' g: ' + dominantColor.g + ' b: ' + dominantColor.b);
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
      if (cmap) {
        var newPalette = cmap.palette();

        // Clean up
        image.removeCanvas();

        return {r: newPalette[0][0], g: newPalette[0][1], b: newPalette[0][2]};
      } else {
        return false;
      }
    },
    setCardinalColors: function(self) {
      var $target = $('.tracking-point'),
      offset = $target.offset();

      if (self.cardinal === $.noop) {
        var left = Math.ceil(($target.width() / self.$src.width()) * $target.width()),
          top = Math.ceil(($target.height() / self.$src.height()) * $target.height());
        self.cardinal = {
          n: {top: -top, left: 0},
          s: {top: top, left: 0},
          e: {top: 0, left: left},
          w: {top: 0, left: -left}
        };
      }

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
    closestCardinalShift : function(target) {
      if (this.initialDominantColor === $.noop) this.initialDominantColor = this.nextDominantColor;
      var north = this.initialDominantColor.n,
        south = this.initialDominantColor.s,
        east = this.initialDominantColor.e,
        west = this.initialDominantColor.w,
        nDistance = Math.sqrt(Math.abs(north.r - target.r)^2 + Math.abs(north.g - target.g)^2 + Math.abs(north.b - target.b)^2),
        sDistance = Math.sqrt(Math.abs(south.r - target.r)^2 + Math.abs(south.g - target.g)^2 + Math.abs(south.b - target.b)^2),
        eDistance = Math.sqrt(Math.abs(east.r - target.r)^2 + Math.abs(east.g - target.g)^2 + Math.abs(east.b - target.b)^2),
        wDistance = Math.sqrt(Math.abs(west.r - target.r)^2 + Math.abs(west.g - target.g)^2 + Math.abs(west.b - target.b)^2),
        distanceArr = [nDistance, sDistance, eDistance, wDistance],
        min = Math.min.apply(Math, distanceArr),
        index = $(distanceArr).index(min);
        // console.log(distanceArr);
      if (this.prevDistanceArr != distanceArr) {
        this.prevDistanceArr = distanceArr;
        if (index === 0) return 'south';
        if (index === 1) return 'north';
        if (index === 2) return 'west';
        if (index === 3) return 'east';
      } else {
        return false;
      }

    }
  };
  colorTracker.init();

  colorTracker.$src.on('play', function() {
    if (colorTracker.interval === null) {
      colorTracker.interval = setInterval(function () {
        var $trackingPoint = $('.tracking-point'),
          offset = newOffset = $trackingPoint.offset(),
          prevDominantColor = colorTracker.currentDominantColor,
          dominantColor = colorTracker.getDominantColor(
            colorTracker.$src, offset.left - colorTracker.videoOffset.left, offset.top - colorTracker.videoOffset.top, colorTracker.dimensions.w, colorTracker.dimensions.h,
            offset.left - colorTracker.videoOffset.left, offset.top - colorTracker.videoOffset.top, colorTracker.dimensions.w, colorTracker.dimensions.h);

        if (dominantColor && dominantColor !== prevDominantColor) {
          $.each(dominantColor, function(key, value) {
            colorTracker.currentDominantColor[key] = value;
          });
          var shiftDirection = colorTracker.closestCardinalShift(prevDominantColor);
        } else {
          dominantColor = prevDominantColor;
          var shiftDirection = colorTracker.closestCardinalShift(prevDominantColor);
        }

        if (shiftDirection) {
          switch (shiftDirection) {
            case 'north':
              newOffset.top = newOffset.top + colorTracker.cardinal.n.top;
              break;
            case 'south':
              newOffset.top = newOffset.top + colorTracker.cardinal.s.top;
              break;
            case 'east':
              newOffset.left = newOffset.left + colorTracker.cardinal.e.left;
              break;
            case 'west':
              newOffset.left = newOffset.left + colorTracker.cardinal.w.left;
              break;
            default:
              newOffset;
          }

          $trackingPoint.animate({ top: newOffset.top, left: newOffset.top })
            .empty()
            .append('x:' + newOffset.left + ', y:' + newOffset.top)
            .append('<br>')
            .append('w:' + $trackingPoint.width() + ', h:' + $trackingPoint.height());

          // console.log('Dominant Color: r: ' + dominantColor.r + ' g: ' + dominantColor.g + ' b: ' + dominantColor.b);
          $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');
        }

        colorTracker.setCardinalColors(colorTracker);
      }, 29.97);
    }
  });

  colorTracker.$src.on('ended', function() {
    this.currentTime = 0;
    clearInterval(colorTracker.interval);
    $('.tracking-point').remove();
  });
});
