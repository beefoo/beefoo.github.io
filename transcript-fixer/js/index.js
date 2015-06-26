(function() {
  var App;

  App = (function() {
    function App(options) {
      var defaults = {};
      this.options = $.extend(defaults, options);
      this.init();  
    }   
    
    App.prototype.init = function(){
      var _this = this;
      
      $.getJSON('transcripts.json', function(transcripts) {
        console.log('Loaded '+transcripts.length+' transcripts.');
        
        var $container = $('<div />');
        $.each(transcripts, function(i, t){
          $container.append($('<a href="transcript.html?id='+t.item_id+'">'+t.item_title+' ('+t.item_duration_f+')</a>'));
        });
        $('#transcripts').append($container);        
      });
    };
    
    return App;

  })();

  $(function() {
    return new App({});
  });

}).call(this);
