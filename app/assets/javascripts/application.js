// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require jquery
//= require jquery_ujs
//= require jquery-ui
//= require jquery.livequery
//= require cocoon
//= require autocomplete-rails
//= require twitter/bootstrap
//= require combo/jquery.eventdelay.js
//= require combo/jquery.combo.js
//= require_tree .
//

$.datepicker.setDefaults({
  dateFormat: 'yy-mm-dd'
});
$("input.date").datepicker();


$("select.combo").livequery(function (){
  $(this).combo({triggerSelected:true});
});