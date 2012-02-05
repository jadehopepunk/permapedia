/***************************************************************************
 *   Copyright (C) 2009 by Vladimir Kadalashvili
 *   Kadalashvili.Vladimir@gmail.com
 *   Copyright (C) 2010 by Nowhere Man
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/

(function($) {

    $.fn.combo = function(config) {

        // Check if Comb'O is already activated
        var api = $(this).eq(typeof conf == 'number' ? conf : 0).data("combo");
        if(api) return api;

        //default config options
        var defaultConf = {
            //skin name
            skin: "default",

            //this suffix will be appended to the selectbox's name and will be text input's name
            suffix: "_combo",

            //the same as the previous, but for hidden input
            hiddenSuffix: "_comboHidden",

            //initial / default hidden field value.
            //Also applied when user types something that is not in the options list
            initialHiddenValue: "",

            //if provided, will be the value of the text input when it has no value and focus
            emptyText: "",

            //this suffix will be appended to the lazy selectbox's name
            lazySuffix: "__lazy",

            //if true, don't parse the selectbox options until combobox get the focus
            lazyLoading: false,

            //if true, autofilling will be enabled
            autoFill: false,

            //if true, selected option of the selectbox will be the initial value of the combo
            triggerSelected: true,

            //function for options filtering
            filterFn: null,

            //if true, the options list will be placed above text input
            dropUp: false,

            //set the max height for the list, by default it take the css value of max-height attribute
            maxHeight:false,

            //if true, search term will be highlighted in the result list
            highlightTerm: false,

            //delay to trigger the keyPress function
            keyPressDelay: 300,

            //if true, filter function will be sensitive to the case
            //Warning: if liquidFilter option is true, filtering function will be always case insensitive
            caseSensitive: false,

            //if false, filter function will be insensitive to accents characters
            accentsSensitive: true,

            //if true, search term will be filtered by Quicksilver scoring algorithm clone, require liquidmetal.js plugin
            liquidFilter: false,

            //if true liquidFilter will be sort by score instead of items text
            liquidSorting: true,

            //if true all items of the list will be always show, even when you filtering the comboBox
            showAllMode: false,

            //if true all items of the list will be show only if you press non-alpha-numeric keys (e.g. Up, Down, Tab...)
            showMixMode: true,

            //current mode, if true show all the list, if false show only the filtering items
            showMode: false,

            //default last text value
            lastTextValue: "",

            //separator for values of multiple combos
            separator: ",",

            //all callback functions are called in the scope of the current combo instance

            //called after dropdown list appears
            showListCallback: null,

            //called after dropdown list disappears
            hideListCallback: null,

            //called at the end of constructor
            initCallback: null,

            //called at the end of initEvents function
            initEventsCallback: null,

            //called when both text and hidden inputs values are changed
            changeCallback: null,

            //called when text input's value is changed
            textChangeCallback: null
        };
        $.extend(defaultConf, config);

        this.each(function() {
            var selectbox = $(this);
            var regex = new RegExp("^(.+)" + defaultConf.lazySuffix + "$", "i");            
            if (!selectbox.attr("id").match(regex) && defaultConf.lazyLoading) {
                
                selectbox.hide();
                var optionSelected = selectbox.find("option:selected:first");
                var data = [];
                if (optionSelected)
                    data.push({value: optionSelected.val(), text: optionSelected.text()});

                $.extend(defaultConf, {
                    name: selectbox.attr('name'),
                    id: selectbox.attr('id'),
                    container: selectbox.parent(),
                    data: data});
                $cb.create(defaultConf);
            } else {
                var el = new $cb(this, defaultConf);
                selectbox.data("combo", el);

                if (el.config.lazyLoading) {                    
                    var targetSelectbox = $("#" + selectbox.attr("id").replace(regex, "$1"));
                    targetSelectbox.data('combo', el);
                    var $selectbox = targetSelectbox.clone();
                    $selectbox.data('combo', el);
                    el.wrapper.prepend($selectbox);
                    targetSelectbox.remove();
                }
            }
            
        });

    };



    //constructor
    //creates initial markup and does some initialization
    $.combo = function(selectbox, config) {
        if (selectbox.nodeName != "SELECT")
            return;


        this.config = ( config || {});


        this.selectbox = $(selectbox);
        this.selectLen= this.selectbox.get(0).length;

        this.options = this.selectbox.find("option");

        if (config.lazyLoading) {
            var regex = new RegExp("^(.+)" + this.config.lazySuffix + "$", "i");
            this.config.name = this.selectbox.attr("name").replace(regex, "$1");
            this.config.id = this.selectbox.attr("id").replace(regex, "$1");
//            console.debug(this.config.lazySuffix + ":" + this.config.name + "/" + this.config.id);//debug
        } else {
            this.config.name = this.selectbox.attr("name");
            this.config.id = this.selectbox.attr("id");
        }

        this.wrapper = this.selectbox.wrap("<div>").
        hide().
        parent().
        addClass("combo").
        addClass(this.config.skin);

        this.input = $("<input type='text'></input>").
        appendTo(this.wrapper).
        attr("autocomplete", "off").
        attr("name", this.config.name.replace(/\]$/, this.config.suffix + ']')).
        val("");

        this.inputOffset = this.input.offset();

        this.hidden = $("<input type='hidden'></input>").
        appendTo(this.wrapper).
        attr("autocomplete", "off").
        attr("name", this.config.name.replace(/\]$/, this.config.hiddenSuffix + ']')).
        val(this.config.initialHiddenValue);

        this.icon = $("<div></div>").
        appendTo(this.wrapper).
        addClass("icon");

        this.listWrapper = $("<div></div>").
        appendTo(this.wrapper).
        addClass("invisible").
        addClass("list-wrapper");
        this.updateDrop();

        this.createListItems();

        if ($.browser.opera) {
            this.wrapper.css({
                position: "relative",
                left: "0",
                top: "0"
            });
        }
        this.filterFn = ("function" == typeof(this.config.filterFn)) ? this.config.filterFn : this.filterFn;

        this.config.caseSensitive = (this.config.liquidFilter) ?  false : this.config.caseSensitive;
        this.config.liquidSorting = (!this.config.liquidFilter) ?  false : this.config.liquidSorting;
        this.config.showMixMode = (this.config.showAllMode) ?  true : this.config.showMixMode;

        this.lastKey = null;
        this.lastPageY = null;

        // this.overflowCSS = ($.browser.opera) ? "overflow" : "overflowY";
        this.overflowCSS = "overflowY"; // Tested successfully with Opera 9.6 and 10
        this.setListMaxHeight();

        this.multiple = this.selectbox.attr("multiple");

        this.notify("init");

        this.initEvents();
    };

    //shortcuts
    $cb = $.combo;
    $cb.fn = $cb.prototype = {};
    $cb.fn.extend = $cb.extend = $.extend;

    $cb.fn.extend({
        //TOC of our plugin
        //initializes all event listeners
        //it would be more correct to call it initEvents
        initEvents: function() {
            var self = this;

            //Refresh ListItems
            //TODO make the interval seconds as a config option
            setInterval(function(){
                if(self.selectbox.get(0).length != self.selectLen)
                    self.refreshListItems();
            }, 1000);

            //            this.selectbox.change(function(){
            //                //console.debug("selectBox changeEvent");
            //                self.refreshListItems();
            //            });

            this.icon.bind("click", function() {
                self.iconClick();
            });

            $(document).bind("mouseup", function(e) {
                if (self.icon.get(0) == e.target || self.input.get(0) == e.target || self.listWrapper.get(0) == e.target) {
                    return;
                }
                self.hideList();
            });

            this.list.bind("mouseover", function(e) {
                if ($(e.target).hasClass("li-bold")) {
                    return $(e.target).parent('li').trigger('mouseover');
                }
                if (e.target.tagName == 'LI') {
                    var target = $(e.target);
                    // console.debug( Math.abs(self.lastPageY - e.pageY) + " > " + target.height()*1.25);//debug
                    if ( Math.abs(self.lastPageY - e.pageY) > target.height()*1.25 ) {
                        self.lastKey = null;
                        self.lastPageY = null;
                    }
                    if(self.lastKey == null){
                        self.lastPageY = e.pageY;
                    }

                    self.highlight(target);
                } else {
                    e.stopPropagation();
                }
            })
            .bind("mouseup", function(e) {
                if ($(e.target).hasClass("li-bold")) {
                    return $(e.target).parent('li').trigger('mouseup');
                }
                if (e.target.tagName == 'LI') {
                    self.listItemClick($(e.target));
                } else {
                    e.stopPropagation();
                }
            })
            .bind("mouseleave", function(e) {
                if(self.listVisible())
                    self.lastKey = null;
            });

            this.input
            .bind("keydown", function(e) {
                self.keyPress(e);
            })
            .bind("keypress", function(e) {
                if ($cb.KEY.RETURN == e.keyCode) {
                    e.preventDefault();
                }
                if ($cb.KEY.SHIFT == e.keyCode) {
                    e.preventDefault();
                }

                if ($cb.KEY.TAB == e.keyCode) {
                    if (self.listVisible()) {
                        e.preventDefault();
                    }
                }
            })
            .eventDelay({
                delay: self.config.keyPressDelay,
                event: 'keyup',
                fn: function(e){
                    self.keyPress(e);
                }
            })
            .eventDelay({
                delay: self.config.keyPressDelay,
                event: 'paste',
                fn: function(e){
                    self.keyPress(e);
                }
            })
            .eventDelay({
                delay: self.config.keyPressDelay,
                event: 'drop',
                fn: function(e){
                    self.keyPress(e);
                }
            });

            this.wrapper.focusin(function() {
                self.loadListItems();
            });

            this.triggerSelected();
            this.applyEmptyText();

            this.notify("initEvents")
        },
        results: [],
        getTextValue: function() {
            return this.__getValue("input");
        },

        getCurrentTextValue: function() {
            return this.__getCurrentValue("input");
        },

        setLastTextValue: function(val){
            if(val!=this.config.lastTextValue)
                this.config.lastTextValue=val;
        },

        getHiddenValue: function() {
            return this.__getValue("hidden");
        },

        getCurrentHiddenValue: function() {
            return this.__getCurrentValue("hidden");
        },

        __getValue: function(prop) {
            prop = this[prop];
            if (!this.multiple)
                return $.trim(prop.val());

            var tmpVals = prop.val().split(this.config.separator);
            var vals = [];

            for (var i = 0, len = tmpVals.length; i < len; ++i) {
                vals.push($.trim(tmpVals[i]));
            }

            vals = $cb.normalizeArray(vals);
            return vals;
        },

        __getCurrentValue: function(prop) {
            prop = this[prop];
            if (!this.multiple)
                return $.trim(prop.val());
            return $.trim(prop.val().split(this.config.separator).pop());
        },

        //icon click event listener
        iconClick: function() {
            this.loadListItems();

            if (this.listVisible()) {
                this.hideList();
            } else {
                this.showList(this.config.showMixMode);
                if(this.config.highlightTerm) {
                    this.highlightTermFn();
                }
            }
            this.inputFocus();
        },

        //returns true when dropdown list is visible
        listVisible: function() {
            return this.listWrapper.hasClass("visible");
        },

        //shows dropdown list
        showList: function(showMode) {
            var self = this;
            if(!showMode) {
                showMode = this.config.showAllMode;
            }
            if (!showMode && this.list.find(".visible").length == 0) {
                return;
            }
            this.config.showMode = showMode;
            this.listWrapper.removeClass("invisible").
            addClass("visible");
            this.wrapper.css("zIndex", "99999");
            this.listWrapper.css("zIndex", "99999");

            if(showMode) {
                this.list.find("li").removeClass("invisible").
                addClass("visible");
                if(this.config.liquidSorting) {
                    this.restoreListItems("all");
                }
                this.setOverflow();
                this.setListHeight();
            } else{
                this.setOverflow();
                this.setListHeight();
                this.highlightFirst();
                this.listWrapper.scrollTop(0);
            }

            // Determine automatically whether options list should go down or up, backported from Sexy Combo 2.0.7
            var listHeight = this.listWrapper.height();
            var inputHeight = this.wrapper.height();

            var bottomPos = parseInt(this.inputOffset.top) + inputHeight + listHeight;
            var maxShown = $(window).height() + $(document).scrollTop();
            if (bottomPos > maxShown) {
                this.setDropUp(true);
            }
            else {
                this.setDropUp(false);
            }

            if((showMode || this.getTextValue().length == 0)) {
                this.highlight(this.selectedItem(), showMode);
            }

            this.list.find("ul.optgroup span.label").each(function(){
                if($(this).nextAll().hasClass("invisible")) {
                    $(this).removeClass("visible").addClass("invisible");
                } else if($(this).nextAll().hasClass("visible")) {
                    $(this).removeClass("invisible").addClass("visible");
                }
            });

            if($.browser.msie){
                this.list.find("ul.optgroup").each(function(){
                    var els= $(this).find(".visible");
                    var optHeight=0;
                    $.each(els, function(i,n){
                        optHeight+= $(n).height();
                    });
                    $(this).height(optHeight);
                });
            }

            this.scrollDown();

            this.notify("showList");
        },

        //hides dropdown list
        hideList: function() {
            if (this.listWrapper.hasClass("invisible"))
                return;
            this.listWrapper.removeClass("visible").
            addClass("invisible");
            this.wrapper.css("zIndex", "0");
            this.listWrapper.css("zIndex", "99999");
            this.lastKey = null;

            this.notify("hideList");
        },

        //returns sum of all visible items height
        getListItemsHeight: function() {
            return this.list.find("li:first").height() * this.visibleItemsLen();
        },

        //changes list wrapper's overflow from hidden to scroll and vice versa (depending on list items height))
        setOverflow: function() {
            if (this.getListItemsHeight() > this.getListMaxHeight())
                this.listWrapper.css(this.overflowCSS, "scroll");
            else
                this.listWrapper.css(this.overflowCSS, "hidden");
        },

        //highlights active item of the dropdown list
        highlight: function(activeItem, force) {
            //Prevent mouse noising
            if (!force && (($cb.KEY.DOWN == this.lastKey) || ($cb.KEY.UP == this.lastKey) || ($cb.KEY.TAB == this.lastKey)))
                return;

            if(!force){
                this.listItems.removeClass("active");
                $(activeItem).addClass("active");
            }
            //console.debug("highlight item!");//debug

            if(this.listItems.not("li.selected").filter("li.active").length == 0)
                this.list.find("li.selected").addClass("active");

        },

        highlightTermFn: function(term) {
            if(!term)
                term = this.getCurrentTextValue();
            var showMode = this.config.showMode;
            // console.log(showMode);//debug
            if(term.length == 0) {
                this.clearHighlightTerms();
            } else if(term.length > 1) {
                if(showMode) {
                    this.list.find("li.visible").highlight(term,'li-bold');
                } else {
                    this.list.find("li.visible").highlightEach(term,'li-bold');
                }
            }
            this.notify("highlightTermFn");
        },

        clearHighlightTerms: function(){
            this.list.find("li").each(function(){
                $(this).text($(this).text());//remove HTML tags
            });
        },

        //sets text and hidden inputs value
        setComboValue: function(val, pop, hideList) {

            var oldVal = this.input.val();

            var v = "";
            if (this.multiple) {

                v = this.getTextValue();
                if (pop)
                    v.pop();
                v.push($.trim(val));
                v = $cb.normalizeArray(v);
                v = v.join(this.config.separator) + this.config.separator;

            }
            else {
                v = $.trim(val);
            }
            this.input.val(v);
            this.setHiddenValue(val);
            this.filter();
            if (hideList)
                this.hideList();
            this.input.removeClass("empty");


            if (this.multiple)
                this.inputFocus();

            if (this.input.val() != oldVal){
                this.options.filter("option:selected").removeAttr("selected");//Removing all old selected options

                //selecting options in the selectbox
                if(this.multiple){
                    var self=this;
                    $(this.getHiddenValue()).each(function(i,v){
                        self.options.each(function(){
                            if($(this).val() == v)
                                $(this).attr("selected","selected");
                        });
                    });
                }
                else
                    this.selectbox.val(this.getCurrentHiddenValue());
                this.notify("textChange");
            }
        },



        //sets hidden inputs value
        //takes text input's value as a param
        setHiddenValue: function(val) {
            var set = false;
            val = $.trim(val);
            var oldVal = this.hidden.val();

            if (!this.multiple) {
                for (var i = 0, len = this.options.length; i < len; ++i) {
                    if (val == this.options.eq(i).text()) {
                        this.hidden.val(this.options.eq(i).val());
                        set = true;
                        break;
                    }
                }
            }
            else {
                var comboVals = this.getTextValue();
                var hiddenVals = [];
                for (var i = 0, len = comboVals.length; i < len; ++i) {
                    for (var j = 0, len1 = this.options.length; j < len1; ++j) {
                        if (comboVals[i] == this.options.eq(j).text()) {
                            hiddenVals.push(this.options.eq(j).val());
                        }
                    }
                }

                if (hiddenVals.length) {
                    set = true;
                    this.hidden.val(hiddenVals.join(this.config.separator));
                }
            }

            if (!set) {
                this.hidden.val(this.config.initialHiddenValue);
            }

            if (oldVal != this.hidden.val())
                this.notify("change");
        },

        listItemClick: function(item) {
            this.setComboValue(item.text(), true, true);
            if(this.config.autoFill && !this.multiple) {
                this.confirmSelection(this.input.get(0));
            }
            this.inputFocus();
        },

        //adds / removes items to / from the dropdown list depending on combo's current value
        filter: function() {
            var comboValue = this.input.val();

            this.setLastTextValue(comboValue);
            var self = this;

            /*if(this.config.highlightTerm)
                this.clearHighlightTerms();*/
            this.results = [];
            // Better cache but activeItem isn't persistent
            // var listItems;
            // if (this.config.liquidSorting) {
                // listItems = this.cacheListItems.clone();
            // } else {
                // listItems = this.list.find("li");
            // }
            this.list.find("li").each(function() {
                var $this = $(this);
                var itemValue = $this.text();

                var score;
                if ((score=self.filterFn.call(self, self.getCurrentTextValue(), itemValue, self.getTextValue())) > 0.1) {
                    $this.removeClass("invisible").
                    addClass("visible");
                    //if(self.config.highlightTerm){
                        //$this.highlightEach(self.formatText(self.getCurrentTextValue()));
                        //self.notify("highlightTerm");
                        //itemValue=self.highlightTermFn(itemValue, self.getCurrentTextValue());
                        //$this.html(itemValue);
                    //}
                    if(self.config.showAllMode) {
                        self.highlight($this);
                    }

                } else {
                    $this.removeClass("visible").
                    addClass("invisible");
                }

                if(self.config.liquidSorting) {
                    self.results.push({
                        //name: $.trim($(this).text()),
                        //index: i,
                        value: $(this).html(),
                        klass: $(this).attr("class"),
                        score: score,
                        optgroup: $(this).parent('ul.optgroup').length == 1
                    });
                }
            });

            if(this.config.liquidSorting)
            {
                if(this.getTextValue().length > 0) {
                    this.restoreListItems();
                } else {
                    this.restoreListItems("all");
                }
            }

            this.setOverflow();
            this.setListHeight();
        },

        //default dropdown list filtering function
        filterFn: function(currentComboValue, itemValue, allComboValues) {
            var formatItemValue = this.formatText(itemValue);
            currentComboValue = this.formatText(currentComboValue);

            if (this.multiple) {
                //exclude values that are already selected
                for (var i = 0, len = allComboValues.length; i < len; ++i) {

                    if (formatItemValue == this.formatText(allComboValues[i])) {
                        return 0;
                    }
                }
            }

            var result = null;
            if(this.config.liquidFilter){
                result = LiquidMetal.score(formatItemValue, currentComboValue);//LiquidMetal
                // score = formatItemValue.score(currentComboValue);//Quicksilver, buggy with long string
            } else if(formatItemValue.search(currentComboValue) == 0) {
                result = 1.0;
            }
            return result;
        },

        createListItems: function(){
            var self = this;
            if((this.list=this.listWrapper.children("ul:not(.optgroup)")).length == 0) {
                this.list = $("<ul></ul>").appendTo(this.listWrapper);
            }

            this.options.each(function(i) {
                //if(i == 0)
                //    console.debug("create option!");//debug
                var optionText = $.trim($(this).text());
                var parent=self.list;
                var optGroup;
                if((optGroup=$(this).parent('optgroup')).length == 1){

                    var groups=parent.find("span").filter(function(){
                        var $this=$(this);
                        if($this.text() == optGroup.attr('label'))
                        {
                            parent=$this.parent("ul");
                            return $this;
                        }
                    });

                    if(!groups.length)
                    {
                        parent=parent=$("<ul></ul>").addClass("optgroup").appendTo(parent);
                        $("<span></span>").text(optGroup.attr('label')).addClass("label visible").appendTo(parent);
                    }
                }

                $("<li></li>").
                appendTo(parent).
                text(optionText).
                addClass("visible");
            });

            this.listItems = this.list.find("*");
            this.cacheList = this.list.filter("*").clone(true).get();
            this.cacheListItems = $(this.cacheList).find("li");

            // Auto width
            var maxWidth = this.selectbox.outerWidth();
            if (this.config.highlightTerm) {
                maxWidth *= 1.08; // increase the width to 8% if higlighting term option is enabled
            }
            if (maxWidth > this.listWrapper.width()) {
                this.input.width(maxWidth-this.icon.width());
                this.icon.css('left',maxWidth-this.icon.width());
                this.listWrapper.width(maxWidth);
            }

            if(!this.config.triggerSelected && this.getActive().length == 0){
                this.highlightFirst();
            }
        },

        // Lazy loading related
        loadListItems: function(){
            if (this.config.lazyLoading) {
                this.config.lazyLoading = false;
                var lazySelectBox = this.selectbox;
                var regex = new RegExp("^(.+)" + this.config.lazySuffix + "$", "i");
                this.selectbox = $("#" + this.selectbox.attr("id").replace(regex, "$1"));
                this.refreshListItems();
                // Remove the lazy select element
                lazySelectBox.remove();
            }
//            console.debug(this.config.lazyLoading);//debug
         },

        refreshListItems: function(){
            this.selectLen=this.selectbox.get(0).length;
            this.options = this.selectbox.find("option");//refresh selectBox options
            this.list.empty();
            this.createListItems();
        },

        restoreListItems: function(type) {
            var self = this;
            if(!type) {
                type = "match";
            }
            switch (type) {
                case "all":
                    var activeIndex = this.getItemIndex();
                    this.list.empty().html($(this.cacheList).clone().children());

                    //                    $.each(this.results,function(k,v){
                    //                        var li = $("<li />").html(v.value).addClass(v.klass);
                    //                        if(v.optgroup)
                    //                            li = $("<ul class='optgroup' />").append(li);
                    //                        list.append(li);
                    //                    });
                    //this.refreshListItems();
                    break;
                case "match":
                    this.results.sort(function(a, b) {
                        return b.score - a.score;
                    });

                    var list = this.list.empty();
                    $.each(this.results,function(k,v){
                        var li = $("<li></li>").html(v.value).addClass(v.klass);
                        if(v.optgroup) {
                            li = $("<ul class='optgroup'></ul>").append(li);
                        }
                        list.append(li);
                    });

                    // Better cache but activeItem isn't persistent
                    // var sortedList = $("<ul></ul>");
                    // $.each(this.results,function(k,v){
                        // console.debug(v.index + " " + v.score);//debug
                        // var li =  $(self.cacheListItems[v.index]).clone().removeClass().addClass(v.klass);
                        // if(v.optgroup) {
                            // li = $("<ul class='optgroup'></ul>").append(li);
                        // }
                        // sortedList.append(li);
                    // });
                    // this.list.empty().html(sortedList.children());

                    break;
                default:
                    break;
            }

            this.listItems =  this.list.find("*");

            if(type == "all") {
                this.listItems.removeClass("active");
                var activeItem=this.list.find("li").eq(activeIndex);

                if(activeItem) {
                    activeItem.addClass("active");
                    //activeItem.highlightEach(this.formatText(this.getCurrentTextValue()));
                    //self.notify("highlightTerm");
                    //activeItem.html(this.highlightTermFn(activeItem.text(), this.getCurrentTextValue()));
                }

                // if(activeItem.text() != this.getCurrentTextValue()){
                    // this.list.find("li.visible").each(function(){
                        // $(this).html(self.highlightTermFn($(this).text(), self.getCurrentTextValue()));
                    // });
                // }
            }
            this.notify("restoreListItems");
        },

        //remove the combobox and the selectbox
        remove: function(){
            this.wrapper.remove();
        },

        //remove the combobox and restore the selectbox
        destroy: function(){
            var $selectbox;
            if(this.config.lazyLoading) {
              var regex = new RegExp("^(.+)" + this.config.lazySuffix + "$", "i");
              $selectbox = $("#" + this.selectbox.attr("id").replace(regex, "$1")).clone();
            } else
                $selectbox = this.selectbox.clone();
            
            this.wrapper.parent().append($selectbox.show());
            this.wrapper.remove();
        },

        //apply formatting options on text
        formatText: function(val){
            if(val && val.length > 0) {
                if(!this.config.accentsSensitive) {
                    val = $.accentFolding(val);
                    // val = this.removeAccents(val);
                }

                if(!this.config.caseSensitive) {
                    val = val.toLowerCase();
                }
            }
            return val;
        },

        //returns integer value of list wrapper's max-height attribute
        getListMaxHeight: function() {
            if(typeof(this.config.maxHeight) != 'number') {
                // console.debug("No max-height value set, used the listItems height");//debug
                this.setListMaxHeight(this.getListItemsHeight());
            }
            return this.config.maxHeight;
        },

        //set integer value of list wrapper's max-height
        setListMaxHeight: function(maxHeight) {
            if(!maxHeight) {
                if($.browser.msie && $.browser.version <= 6) {
                    //console.debug("IE6 maxHeight:" + this.listWrapper.css("height"));//debug
                    maxHeight = this.listWrapper.css("height");
                } else {
                    maxHeight = this.listWrapper.css("max-height");
                }
            }
            this.config.maxHeight = parseInt(maxHeight);
        },

        //corrects list wrapper's height depending on list items height
        setListHeight: function() {
            var liHeight = this.getListItemsHeight();
            var maxHeight = this.getListMaxHeight();
            var listHeight = this.listWrapper.height();
            // console.debug("liHeight:" + liHeight);
            // console.debug("maxHeight:" + maxHeight);
            // console.debug("listHeight:" + listHeight);
            var newHeight;
            if (liHeight < listHeight) {
                newHeight = liHeight;
            //this.list.find("ul.optgroup").height(liHeight);
            } else if (liHeight > listHeight) {
                newHeight = Math.min(maxHeight, liHeight);
            }
            if (newHeight) {
                if ($.browser.msie) {
                    newHeight*=1.05;// Increase the height to 5% because Internet Explorer is buggy
                }
                this.listWrapper.height(newHeight);
            }
        },

        //returns active (hovered) element(s) of the dropdown list
        getActive: function() {
            return this.list.find(".active");
        },

        keyPress: function(e) {
            var k = $cb.KEY;
            var KEYDOWN = e.type == "keydown";
            var KEYUP = e.type == "keyup";
            var DROP = e.type == "drop";
            var PASTE = e.type == "paste";

            if (KEYDOWN) {
                this.lastKey = e.keyCode;
            }
            switch (e.keyCode) {
                case k.RETURN:
                    if (KEYDOWN)
                    {
                        this.setComboValue(this.getActive().text(), true, true);
                        if (!this.multiple && !this.config.autoFill) {
                            //this.input.blur();
                        }
                        if(this.config.autoFill && !this.multiple) {
                            this.confirmSelection(this.input.get(0));
                        }
                    }
                    break;
                case k.DOWN:
                    if (KEYDOWN)
                    {
                        if (this.listVisible()) {
                            this.highlightNext();
                        } else
                        {
                            //this.lastKey = null;
                            this.showList(this.config.showMixMode);
                            if (this.config.highlightTerm) {
                                this.clearHighlightTerms();
                                this.highlightTermFn();
                            }
                        }
                    }
                    break;
                case k.UP:
                    if (KEYDOWN)
                    {
                        if (this.listVisible()) {
                            this.highlightPrev();
                        } else {
                            //this.lastKey = null;
                            this.showList(this.config.showMixMode);
                            if(this.config.highlightTerm) {
                                this.clearHighlightTerms();
                                this.highlightTermFn();
                            }
                        }
                    }
                    break;
                case k.ESC:
                    if (KEYDOWN){
                        this.hideList();
                        e.preventDefault();
                    }
                    break;
                case k.SHIFT:
                    if (KEYDOWN) {
                        e.preventDefault();
                    }
                    break;
                case k.TAB:
                    if (KEYDOWN) {
                        if (this.listVisible()) {
                            if(e.shiftKey == true) {
                                this.highlightPrev();
                            } else {
                                this.highlightNext();
                            }
                            e.preventDefault();
                        }
                    }
                    // else {
                        // e.preventDefault();// IE6 doesn't like this
                    // }
                    break;
                default:
                    if (KEYUP || DROP || PASTE) {
                        if (this.config.lastTextValue != this.input.val()) {
                            this.inputChanged();
                        } else if (!this.listVisible() && KEYUP) {
                            this.showList();
                        }
                    }
                    break;
            }
        },

        //returns number of currently visible list items
        visibleItemsLen: function() {
            return this.list.find(".visible").length;
        },

        //returns number of currently visible LI list items
        visibleLiLen: function() {
            return this.list.find("li.visible").length;
        },

        //triggered when the user changes combo value by typing
        inputChanged: function() {
            this.filter();

            if (this.visibleItemsLen()) {
                this.showList();
                if(this.config.highlightTerm) {
                    this.highlightTermFn();
                }
                this.setOverflow();
                this.setListHeight();
            } else{
                this.hideList();
            }
            this.setHiddenValue(this.input.val());
            this.notify("textChange");

        },

        //highlights first item of the dropdown list
        highlightFirst: function() {
            this.listItems.removeClass("active").filter("li.visible:eq(0)").addClass("active");
            this.autoFill();
        },

        //highlights list item before currently active item
        highlightPrev: function() {
            // console.debug("Up:" + this.getActiveItemIndex() + " > 0");//debug
            if(this.getActiveItemIndex() > 0) {
                var $prev =  this.list.find("li.visible").eq(this.getActiveItemIndex()-1);

                if ($prev.length) {
                    this.getActive().removeClass("active");
                    $prev.addClass("active");
                    this.scrollUp();
                }
                if(this.config.autoFill) {
                    this.autoFill();
                }
            }
        },

        //highlights item of the dropdown list next to the currently active item
        highlightNext: function() {
            // console.debug("Down:" + (this.getActiveItemIndex()+1) + " < " + this.visibleLiLen());//debug
            if(this.getActiveItemIndex()+1 < this.visibleLiLen()) {
                var $next = this.list.find("li.visible").eq(this.getActiveItemIndex()+1);

                if ($next.length) {
                    this.listItems.removeClass("active");
                    $next.addClass("active");
                    this.scrollDown();
                }
                if(this.config.autoFill) {
                    this.autoFill();
                }
            }
        },

        //scrolls list wrapper down when needed
        scrollDown: function() {
            if ("scroll" != this.listWrapper.css(this.overflowCSS))
                return;

            var beforeActive = this.getActiveIndex() + 1;
            if ($.browser.opera) {
                ++beforeActive;
            }
            var minScroll = this.list.find("li").height() * beforeActive - this.listWrapper.height();

            if ($.browser.msie)
                minScroll += beforeActive;
            if (this.listWrapper.scrollTop() < minScroll)
                this.listWrapper.scrollTop(minScroll);
        },

        //returns index of currently active list elements
        getActiveIndex: function() {
            return $.inArray(this.getActive().get(0), this.list.find(".visible").get());
        },

        //returns index of currently active list items
        getActiveItemIndex: function() {
            return $.inArray(this.getActive().get(0), this.list.find("li.visible").get());
        },

        //returns index of currently cacheList items
        getItemIndex: function() {
            /*var self=this;
            console.debug($.inArray(this.getActive().get(0), cacheList.find("li")));
            var el=$("li:contains('" + this.getActive().text() + "')",cacheList);
            console.debug(cacheList.index(el));
            return cacheList.find("li").map(function(i){
                if(self.getActive().text() == $(this).text()){
                    console.debug("Index: " + i);
                    return i;
                }
            })[0];    */
            var activeItem = this.getActive().clone();
            activeItem.html(activeItem.text()).removeClass().addClass("visible");
            var result=null;
            this.cacheListItems.each(function(k,v){
                if(activeItem.html() == $(v).html())  {
                    result = k;
                    return;
                }
            });
            return result;
        //           return $.inArray(this.getActive().get(0), this.cacheListItems)
        //return $.inArray(this.getActive().get(0), this.list.find("li.visible").get());
        },


        //scrolls list wrapper up when needed
        scrollUp: function() {

            if ("scroll" != this.listWrapper.css(this.overflowCSS))
                return;

            var maxScroll = this.getActiveIndex() * this.list.find("ul.optgroup span.label, li").height();

            if (this.listWrapper.scrollTop() > maxScroll) {
                this.listWrapper.scrollTop(maxScroll);
            }
        },

        //emptyText stuff
        applyEmptyText: function() {
            if (!this.config.emptyText || !this.config.emptyText.length)
                return;

            //TODO move this events in initEvents function ?
            var self = this;
            this.input.bind("focus", function() {
                self.inputFocus();
            }).
            bind("blur", function() {
                self.inputBlur();
            });

            if ("" == this.input.val()) {
                this.input.addClass("empty").val(this.config.emptyText);
            }
        },

        inputFocus: function() {
            if (this.input.hasClass("empty")) {
                this.input.removeClass("empty").
                val("");
            }
            this.input.get(0).focus();
        },

        inputBlur: function() {
            if ("" == this.input.val()) {
                this.input.addClass("empty").
                val(this.config.emptyText);
            }
            this.input.get(0).blur();
        },

        //triggerSelected stuff
        triggerSelected: function() {
            if (!this.config.triggerSelected)
                return;

            var self = this;
            //self.setComboValue(this.options.filter("option:selected").text(), false, true);
            this.options.filter("option:selected").each(function() {
                self.setComboValue($(this).text(), false, true);
            });

        },

        //Find corresponding item of selected option
        selectedItem: function() {
            var self=this;
            var selectedItem=this.options.filter("option:selected");
            this.listItems.removeClass("selected");
            selectedItem.each(function(){
                var text=$(this).text();
                var currentItem;
                return self.listItems.
                map(function(){
                    if((currentItem=$(this)).text() == text)
                        return currentItem;
                }).get(0).addClass("selected");
            });
        },

        //autofill stuff
        autoFill: function() {
            if (!this.config.autoFill || $cb.KEY.BACKSPACE == this.lastKey || this.multiple || this.input.val() == this.config.emptyText)
                return;

            var curVal = this.input.val();
            var newVal = this.getActive().text();
            this.input.val(newVal);
            this.selection(this.input.get(0), curVal.length, newVal.length);

        },

        //provides selection for autofilling
        //borrowed from jCarousel
        selection: function(field, start, end) {
            if( field.createTextRange ){
                var selRange = field.createTextRange();
                selRange.collapse(true);
                selRange.moveStart("character", start);
                selRange.moveEnd("character", end);
                selRange.select();
            } else if( field.setSelectionRange ){
                field.setSelectionRange(start, end);
            } else {
                if( field.selectionStart ){
                    field.selectionStart = start;
                    field.selectionEnd = end;
                }
            }
        // field.focus();
        },

        // Confirm the text selection of the given field
        confirmSelection: function(field) {
            this.selection(field, this.getTextValue().length, this.getTextValue().length);
        },

        //for internal use
        updateDrop: function() {
            if (this.config.dropUp) {
                this.listWrapper.addClass("list-wrapper-up");
            } else {
                this.listWrapper.removeClass("list-wrapper-up");
            }
        },

        //updates dropUp config option
        setDropUp: function(drop) {
            this.config.dropUp = drop;
            this.updateDrop();
        },

        notify: function(evt) {
            if (!$.isFunction(this.config[evt + "Callback"]))
                return;

            this.config[evt + "Callback"].call(this);
        }
    });

    $cb.extend({
        //key codes
        //from jCarousel
        KEY: {
            UP: 38,
            DOWN: 40,
            DEL: 46,
            TAB: 9,
            RETURN: 13,
            ESC: 27,
            COMMA: 188,
            PAGEUP: 33,
            PAGEDOWN: 34,
            BACKSPACE: 8,
            SHIFT: 16
        },

        //for debugging
        log: function(msg) {
            var $log = $("#log");
            $log.html($log.html() + msg + "<br />");
        },

        createSelectbox: function(config) {
            if (config.lazyLoading) {
                var lazySuffix = "__lazy"; // TODO DRY already set in defaultConf
                config.name += lazySuffix;
                config.id += lazySuffix;
            }
            var $selectbox = $("<select></select>").
            appendTo(config.container).
            attr({
                name: config.name,
                id: config.id,
                size: "1"
            });

            if (config.multiple)
                $selectbox.attr("multiple", true);

            var data = config.data;
            var selected = false;

            for (var i = 0, len = data.length; i < len; ++i) {
                selected = data[i].selected || false;
                $("<option></option>").appendTo($selectbox).
                attr("value", data[i].value).
                attr("selected", selected).
                text(data[i].text);
            }

            return $selectbox.get(0);
        },

        create: function(config) {
            var defaults = {
                //the name of the selectbox
                name: "",
                //the ID of the selectbox
                id: "",
                //data for the options
                /*
        This is an array of objects. The objects should contain the following properties:
        (string)value - the value of the <option>
        (string) text - text of the <option>
        (bool) selected - if set to true, "selected" attribute of this <option> will be set to true
        */
                data: [],

                //if true, combo with multiple choice will be created
                multiple: false,

                //an element that will contain the widget
                container: $(document),
                //url that contains JSON object for options data
                //format is the same as in data config option
                //if passed, "data" config option will be ignored
                url: "",
                //params for AJAX request
                ajaxData: {}
            };
            config = $.extend({}, defaults, config || {});

            if (config.url) {
                return $.getJSON(config.url, config.ajaxData, function(data) {
                    delete config.url;
                    delete config.ajaxData;
                    config.data = data || [];
                    return $cb.create(config);
                });
            }

            config.container = $(config.container);

            var selectbox = $cb.createSelectbox(config);
            return new $(selectbox).combo(config);

        },

        normalizeArray: function(arr) {
            var result = [];
            for (var i = 0, len =arr.length; i < len; ++i) {
                if ("" == arr[i])
                    continue;

                result.push(arr[i]);
            }

            return result;
        }
    });
})(jQuery);

