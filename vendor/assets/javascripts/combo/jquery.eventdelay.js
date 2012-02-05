(function($){
  /*
  * jQuery delayed event execution.
  *
  * http://ihatecode.blogspot.com/2008/04/jquery-time-delay-event-binding-plugin.html
  * Usage :
    $("#my-input")..eventDelay({
        delay: 500,
        event: 'keyup',
        fn: function(){
            alert(this.value);
        }
    });
  */
  $.fn.eventDelay = function(options) {
    var timer;

    var delayImpl = function(domElem,eventObj) {
      if (timer != null) {
        clearTimeout(timer);
      }
      var newFn = function() {
      options.fn.call(domElem, eventObj);
      };
      timer = setTimeout(newFn, options.delay);
    }

    return this.each(function() {
      var obj = $(this);
      obj.bind(options.event, function(eventObj) {
        delayImpl(this,eventObj);
      });
    });

  };

})(jQuery);

