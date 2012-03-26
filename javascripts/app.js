$(window).load(function() {
  var $video = $('#video'),
  videoOffset = $video.offset();
  $('#canvas').boxer({
    stop: function(event, ui) {
      var offset = ui.box.offset(),
      dimensions = { 'w': ui.box.width(), 'h' : ui.box.height() },
      dominantColor = getDominantColor($video, offset.left - videoOffset.left, offset.top- videoOffset.top, dimensions.w, dimensions.h,
        offset.left - videoOffset.left, offset.top - videoOffset.top, dimensions.w, dimensions.h);
      ui.box.css({ border: '1px dashed white', background: 'rgba(255,69,0, 0.5)', padding: '0.5em' })
        .append('x:' + offset.left + ', y:' + offset.top)
        .append('<br>')
        .append('w:' + ui.box.width() + ', h:' + ui.box.height());
      ui.box.attr('id', 'trackingPoint' + Math.floor(Math.random(24)*10000)).addClass('tracking-point');
      console.log('Dominant Color: r: ' + dominantColor.r + ' g: ' + dominantColor.g + ' b: ' + dominantColor.b);
      $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');
    }
  });
});
