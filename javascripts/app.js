// $(document).ready(function(){

//   // Use mustache.js templating to create layout

//   var imageArray = { images: [
//     {"file": "3.jpg"},
//     {"file": "4.jpg"},
//     {"file": "5.jpg"},
//     {"file": "logo1.png"},
//     {"file": "icon1.png", "colorCount": "4", "class": "fbIcon"}
//   ]};

//   var html = Mustache.to_html($('#template').html(), imageArray);
//   $('#main').append(html);

//   // Use lettering.js to give letter by letter styling control for the h1 title
//   $("h1").lettering();


//   // Once images are loaded, loop through each one, getting dominant color
//   // and palette and displaying them.
//   $('img').imagesLoaded(function(){

//     $('img').each(function(index){

//       var imageSection = $(this).closest('.imageSection'),
//           swatchEl;

//       // Dominant Color
//       var dominantColor = getDominantColor(this);

//       swatchEl = $('<div>', {
//         'class': 'swatch'
//       }).css('background-color','rgba('+dominantColor.r+','+dominantColor.g+ ','+dominantColor.b+', 1)');
//       imageSection.find('.dominantColor .swatches').append(swatchEl);



//       // Palette
//       var colorCount = $(this).attr('data-colorcount')? $(this).data('colorcount'): 10;
//       var medianPalette = createPalette(this, colorCount);

//       var medianCutPalette = imageSection.find('.medianCutPalette .swatches');
//       $.each(medianPalette, function(index, value){
//         swatchEl = $('<div>', {
//           'class': 'swatch'
//         }).css('background-color','rgba('+value[0]+','+value[1]+ ','+value[2]+', 1)');
//         medianCutPalette.append(swatchEl);
//       });

//     });

//   });
// });


$(window).load(function() {
  var $video = $('#video'),
  videoOffset = $video.offset();
  console.log(videoOffset);
  $('#canvas').boxer({
    stop: function(event, ui) {
      var offset = ui.box.offset(),
      dimensions = { 'w': ui.box.width(), 'h' : ui.box.height() },
      dominantColor = getDominantColor($video, offset.left - videoOffset.left, offset.top- videoOffset.top, dimensions.w, dimensions.h,
        offset.left - videoOffset.left, offset.top - videoOffset.top, dimensions.w, dimensions.h);
      ui.box.css({ border: '1px solid white', background: 'rgba(255,69,0, 0.5)', padding: '0.5em' })
        .append('x:' + offset.left + ', y:' + offset.top)
        .append('<br>')
        .append('w:' + ui.box.width() + ', h:' + ui.box.height());
      console.log(dominantColor);
      $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');
    }
  });
  // offsets = { 'x': 240, 'y': 180 },
  // dimensions = { 'w': $video.width() - offsets.x, 'h' : $video.height() - offsets.y };
  // window.dominantColor = getDominantColor($video, offsets.x, offsets.y, dimensions.w, dimensions.h,
  //   offsets.x, offsets.y, dimensions.w, dimensions.h);
  // console.log(dominantColor);
  // $('body').css('background', 'rgb(' + dominantColor.r + ',' + dominantColor.g + ',' + dominantColor.b + ')');
});
