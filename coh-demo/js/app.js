(function() {
  var App;

  App = (function() {
    function App(options) {
      var defaults = {};
      this.options = $.extend(defaults, options);
      this.init();  
    }   
    
    App.prototype.init = function(){
      
      this.initSoundManager();
      this.listenersNav();
      this.checkForHash();
      
      
    };
    
    App.prototype.checkForHash = function(){
      var hash = window.location.hash,
          step = 0;
      if ( hash.length > 1 && $(hash).length > 0 ) {
        step = $(".slide").index($(hash));        
      }
      this.slideSet(step);
    };
    
    App.prototype.initSoundManager = function(){
      var _this = this;
           
      soundManager.setup({
        url: 'js/vendor/',
        flashVersion: 9,
        preferFlash: false,
        onready: function() {
          _this.onSoundManagerReady();
        }
      });
    };
    
    App.prototype.listenersNav = function(){
      var _this = this;
      
      // slide click navigation
      $('.trigger-next').on('click', function(e){
        e.preventDefault();
        _this.slideNext();
      });
      
      // slide key navigation
      $(window).keydown(function(e){ 
        switch( e.keyCode ) { 
          case 32: // space
          case 39: // right arrow
            e.preventDefault();
            _this.slideNext();
            break;
          case 37: // left arrow
            e.preventDefault();
            _this.slidePrev();
            break;
          case 80: // p
          case 13: // enter
            e.preventDefault();
            _this.togglePlay();
            break;
        }
      });
    };
    
    App.prototype.onSoundManagerReady = function(){
      console.log('SoundManager ready.');
      var _this = this;
      this.players = {};
      this.playing_id = false;
      
      $('.slide[data-audio]').each(function(){
        var url = $(this).attr('data-audio'),
            id = $(this).attr('id');
        var player = soundManager.createSound({
          url: url,
          autoLoad: true,
          autoPlay: false,
          onfinish: function() {
            _this.playing_id = false;
          }
        });
        _this.players[id] = player;
      });
    };
    
    App.prototype.slideIndex = function(){
      var $active = $(".slide.active").first();
      return $(".slide").index($active);
    };
    
    App.prototype.slideNext = function(){
      var i = this.slideIndex();
      i++;
      if (i < $(".slide").length) this.slideSet(i);
    };
    
    App.prototype.slidePrev = function(){
      var i = this.slideIndex();
      i--;
      if (i >= 0) this.slideSet(i);
    };
    
    App.prototype.slideSet = function(i){
      console.log('Slide '+i);
      var $active = $('.slide').eq(i);
      $('.slide').removeClass('active');
      $active.addClass('active');
      window.location.hash = '#' + $active.attr('id');
      
      // center copy
      var $copy = $active.find('.slide-copy'),
          copyHeight = $copy.height();          
      $copy.css({
        'top': '50%',
        'margin-top': '-'+(copyHeight/2)+'px'
      });
    };
    
    App.prototype.togglePlay = function(){
      var $active = $(".slide.active").first(),
          id = this.playing_id || $active.attr('id'),
          player = this.players[id];
          
      if (!player) return;
        
      if ($active.hasClass('playing')) {
        $active.removeClass('playing');
        player.pause();
        this.playing_id = false;
        
      } else {
        player.setPosition(0);
        player.play();
        $active.addClass('playing');
        this.playing_id = id;
      }
    }
    
    return App;

  })();

  $(function() {
    return new App(config);
  });

}).call(this);
