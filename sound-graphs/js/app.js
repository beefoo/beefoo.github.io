(function() {
  var App;

  App = (function() {
    function App(options) {
      var defaults = {};
      this.options = $.extend(defaults, options);
      this.init();
    }

    App.prototype.init = function(){

      var _this = this,
          midi_loaded = new $.Deferred(),
          data_loaded = new $.Deferred();

      // show button when all is ready
      $.when(this.midi_loaded, this.data_loaded).done(function() {
        $('#loading').hide();
        $('#graph-play').show();
      });

      // init play button
      $('#graph-play').on('click', function(){
        _this.play();
      });

      // init stop button
      $('#graph-stop').on('click', function(){
        _this.stop();
      });

      // load midi
      MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
        instrument: "acoustic_grand_piano",
        callback: function() {
          console.log('loaded sound font.');
          midi_loaded.resolve();
        }
      });

      // init data
      this.data = [];
      d3.csv("data/co2.csv", function(d) {
        return {
          date: new Date(+d.year, d.month-1, 1), // convert year/month to date
          value: parseFloat(d.co2)
        };
      }, function(error, rows) {
        console.log('Retrieved CSV with '+rows.length+' rows');
        _this.createGraph(rows);
        _this.data = rows;
        data_loaded.resolve();
      });

    };

    App.prototype.createGraph = function(data){
      var margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = 800 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;
          x = d3.time.scale().range([0, width]),
          y = d3.scale.linear().range([height, 0]),
          xAxis = d3.svg.axis().scale(x).orient("bottom"),
          yAxis = d3.svg.axis().scale(y).orient("left");

      var line = d3.svg.line()
          .x(function(d) { return x(d.date); })
          .y(function(d) { return y(d.value); });

      var svg = d3.select("#visual-graph").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain(d3.extent(data, function(d) { return d.value; }));

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("CO2 (parts per million)");

      svg.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);

    };

    App.prototype.play = function(){
      if (!'speechSynthesis' in window) {
        alert('speech synthesis is not supported in your browser!');
        return false;
      }

      var _this = this,
          $button = $('#graph-play'),
          data = this.data;

      $button.hide();
      $('#graph-stop').show();

      // intro text
      var summary = {};
      summary.intro = $button.attr('data-summary') + '.';
      summary.intro += "Sound pitch correlates to " + $button.attr('data-pitch-label') + '.';

      // time text
      var ms = this.options.ms_per_value * data.length;
      summary.time = 'The duration of the graph is ' + this.msToString(ms);

      // min/max text
      var min = d3.min(data, function(row){return row.value;}),
          max = d3.max(data, function(row){return row.value;});
      summary.min = 'The minimum value is '+min+'.';
      summary.max = 'The maximum value is '+max+'.';

      // init midi
      var volume = this.options.midi_volume,
          velocity = this.options.midi_velocity,
          delay = this.options.midi_delay,
          range = this.options.midi_range,
          ms_per_value = this.options.ms_per_value,
          data_labels = this.options.data_labels,
          label_every = parseInt(Math.floor(data.length / data_labels));
      MIDI.setVolume(0, volume);

      // speak summary
      $('body').queue( "summary", function(next) {
        console.log('intro..');
        _this.speek(summary.intro, next);

      }).queue( "summary", function(next) {
        console.log('time..');
        _this.speek(summary.time, next);

      }).queue( "summary", function(next) {
        console.log('min..');
        _this.speek(summary.min, next);

      }).queue( "summary", function(next) {
        MIDI.noteOn(0, range[0], velocity, 0);
        MIDI.noteOff(0, range[0], delay);
        setTimeout(function(){ next(); }, 1000);

      }).queue( "summary", function(next) {
        _this.speek(summary.max, next);

      }).queue( "summary", function(next) {
        MIDI.noteOn(0, range[1], velocity, 0);
        MIDI.noteOff(0, range[1], delay);
        setTimeout(function(){ next(); }, 1000);

      }).queue( "summary", function(next) {
        _this.speek("Here is the sound graph.", next);

      }).queue( "summary", function(next) {

        var playQueue = [];

        data.forEach(function(row, i){
          playQueue.push(function(next){
            var percent = (row.value - min) / (max - min),
                note = Math.round((range[1]-range[0]) * percent + range[0]);
            MIDI.noteOn(0, note, velocity, 0);
            MIDI.noteOff(0, note, delay);
            if (i % label_every == 0) {
              _this.speek(''+row.date.getFullYear());
            }
            setTimeout(function(){ next(); }, ms_per_value);
          });
        });

        playQueue.push(function(next){
          $('#graph-stop').hide();
          $('#graph-play').show();
          next();
        });

        $('body').queue("notes", playQueue).dequeue("notes");

        next();

      })
      .dequeue( "summary" );
    };

    App.prototype.speek = function(message, next){
      var utterance = new SpeechSynthesisUtterance(message);

      utterance.onend = function(event) {
        next && next();
      };

      setTimeout(function(){
        window.speechSynthesis.speak(utterance);
      }, 50);

    };

    App.prototype.stop = function(){
      $('body').clearQueue("notes");
      $('body').stop("notes");
      $('body').clearQueue("summary");
      $('body').stop("summary");
      $('#graph-stop').hide();
      $('#graph-play').show();
    };

    App.prototype.msToString = function(ms){
      var s = Math.floor((ms/1000) % 60);
      var m = Math.floor((ms/(1000*60)) % 60);
      var h = Math.floor((ms/(1000*60*60)) % 24);
      var units = [];

      function numberEnding (number) {
        return (number > 1) ? 's' : '';
      }

      if (h) units.push(h + ' hour' + numberEnding(h));
      if (m) units.push(m + ' minute' + numberEnding(m));
      if (s) units.push(s + ' second' + numberEnding(s));

      var str = units.join(', ');

      return str;
    };

    return App;

  })();

  $(function() {
    return new App(config);
  });

}).call(this);
