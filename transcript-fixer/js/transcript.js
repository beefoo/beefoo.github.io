(function() {
  var App;

  App = (function() {
    function App(options) {
      var defaults = {};
      this.options = $.extend(defaults, options);
      this.init();  
    }   
    
    App.prototype.init = function(){      
      this.initTranscript();      
    };
    
    App.prototype.initListeners = function(){
      var _this = this;
           
      $(window).keydown(function(e){ 
        switch(e.keyCode) {
          case 9: // tab
            e.preventDefault();
            _this.selectTextRange();
            break;           
          case 13: // enter
          case 40: // down arrow
            e.preventDefault();
            _this.next();
            break;
            break;
          case 38: // up arrow
            e.preventDefault();
            _this.prev();
            break;
          case 82: // ctrl + r
            if (e.ctrlKey) {
              e.preventDefault();
              _this.playSelected();
            }
        }
      });
      
      $('#transcript').on('click', '.part', function(e){
        var i = $('#transcript').index($(this));
        _this.select(i);
      });
    };
    
    App.prototype.initSoundManager = function(item){
      var _this = this;
           
      soundManager.setup({
        url: 'js/vendor/',
        flashVersion: 9,
        preferFlash: false,
        onready: function() {
          console.log('SoundManager ready.');
          _this.onSoundManagerReady(item);
        }
      });
    };
    
    App.prototype.initTranscript = function(){
      var _this = this,
          id = this._getParameterByName('id'),
          $container = $('<div class="parts"></div>');
          
      this.part_index = -1;
      
      $.getJSON('transcripts/'+id+'.json', function(item) {
        console.log('Loaded data for '+item.item_title);
        
        $.each(item.transcript.parts, function(i, p){
          if (p.text.length > 1) {
            $container.append($('<div id="part-'+p.id+'" class="part" data-start="'+p.start_time+'" data-end="'+p.end_time+'"><input type="text" value="'+p.text+'" /></div>'));
          }            
        });    
        $('#transcript').append($container);
        
        _this.initSoundManager(item);
        _this.initListeners();
        _this.next();
      });
    };
    
    App.prototype.centerSelected = function(){
      var $part = $('.part.active').first(),
          offset = $part.offset().top,
          height = $part.height(),
          windowHeight = $(window).height(),
          scrollOffset;
    
      if (height < windowHeight) {
        scrollOffset = offset - ((windowHeight / 2) - (height / 2));
        
      } else {
        scrollOffset = offset;
      }
      
      $('html, body').animate({scrollTop: scrollOffset}, 500);
    };
    
    App.prototype.clearSelected = function(){
      var $part = $('.part.active').first(),
          end = Math.round($part.attr('data-end') * 1000);
          
      this.player.clearOnPosition(end);
      if (!this.player.paused || this.player.playState > 0) {
        this.player.pause();
      } 
    };
    
    App.prototype.next = function(){      
      this.select(this.part_index+1);
    };
    
    App.prototype.onSoundManagerReady = function(item){
      var protocol = window.location.protocol != "https:" ? 'http:' : 'https:';
      this.player = soundManager.createSound({
        url: protocol+'//s3.amazonaws.com/oral-history/audio/' + item.audio_file_name,
        autoLoad: true,
        autoPlay: false
      });
    };
    
    App.prototype.playSelected = function(){      
      var _this = this,
          $part = $('.part.active').first(),
          start = Math.round($part.attr('data-start') * 1000),
          end = Math.round($part.attr('data-end') * 1000);
      
      this.player.setPosition(start);
      this.player.clearOnPosition(end);
      this.player.onPosition(end, function(e){
        _this.player.pause();
      });
      if (this.player.paused || this.player.playState <= 0) {
        this.player.play();
      }      
    };
    
    App.prototype.prev = function(){      
      this.select(this.part_index-1);
    };
    
    App.prototype.select = function(i){
      if ($('.part.active').length > 0) {
        this.clearSelected();
      }
      
      this.part_index = i;
      
      if (this.part_index < 0)
        this.part_index = 0;
        
      if (this.part_index >= $('.part').length)
        this.part_index = $('.part').length - 1;
        
      var $part = $('#transcript .part').eq(this.part_index);          
      
      $('.part').removeClass('active');
      $part.addClass('active');
      $part.find('input').focus();
      this.centerSelected();
      this.playSelected();
    };
    
    App.prototype.selectTextRange = function(){
      var $input = $('.part.active input').first(),
          sel_index = $input.attr('data-sel-index') || -1,
          input = $input[0],
          text = input.value,
          words = text.split(' '),
          start = 0,
          end = 0;
      
      // determine word selection
      sel_index++;
      if (sel_index >= words.length) {
        sel_index = 0;
      }      
      
      $.each(words, function(i, w){
        if (i==sel_index) {
          end = start + w.length;
          return false;
        }
        start += w.length + 1;
      });
          
      if (input.setSelectionRange){
        input.setSelectionRange(start, end);
        $input.attr('data-sel-index', sel_index);
      }
    };
    
    App.prototype._getParameterByName = function(name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
          results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };
    
    return App;

  })();

  $(function() {
    return new App({});
  });

}).call(this);
