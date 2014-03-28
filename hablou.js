/*
 */
;(function ( $, window, document, undefined ) {

    var pluginName = "HablouEditor",
            defaults = {
                debug: true,
                text: '',
                fields: {}
            };

    function Plugin ( element, options ) {
            this.element = element;
            this.settings = $.extend( {}, defaults, options );
            this._defaults = defaults;
            this._name = pluginName;
            this.init();
    }

    Plugin.prototype.init = function () {
        this.log('Hablou Editor initialization')

        //debugger
        $(this.element).append($('<div>').attr({ 'class': 'hablou-editor', 'contenteditable': true,}));

        $(document).on('keydown click', '.hablou-editor', function (event) {
            // Check if cursor is in tag
            thiselement = window.getSelection().anchorNode.parentNode;
            $('.hablou-editor .tag').removeClass('selected');
            var code = event.keyCode || event.which;
            if ($(thiselement).hasClass('tag') === true) {
                $(thiselement).addClass('selected');
                // handle tag removal with backspace
                if ((code == 8) || (code == 46)) { // Backspace - delete tag
                    event.preventDefault();
                    $(thiselement).remove();
                }
            }
            if (code == 90 && event.ctrlKey) {
                // Prevent CTRL+Z since tag cannot be handled
                event.preventDefault();
            }
        });

        $(document).on('click', '.debug', function () {
            var html = $.parseHTML($('.hablou-editor').html());
            var output = "";

            $.each(html, function (i, el) {
                output += this.parseElement(el);
            }.bind(this));
            $('.output').text(output);

        });

        this.initComposer(this.settings.text)

    };
    Plugin.prototype.log = function(data) {
        if (window.console && this.settings.debug) {
            window.console.log(data);
        }
    };
    Plugin.prototype.tag = function(text, value) {
        // Use attr data-value instead of jquery .data() for persistence sake
        return $('<span>').addClass('tag').attr('contenteditable', false)
            .attr('data-value', value)
            .text(text);
    };

    Plugin.prototype.insertTextAtCursor = function(text, value) {
        var sel, range;
        sel = window.getSelection();
        // Prevent tag insertion if oustide the editable text area
        if ($(sel.anchorNode).parents(".hablou-editor").html() !== undefined) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            // Create the tag
            var textNode;
            if (value === null) {
                textNode = $("<span>").text(text)[0];
            } else {
                textNode = this.tag(text, value)[0];
            }
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    Plugin.prototype.handlepaste = function(elem, e) {
        // catch paste value and flatten it before insertion
        var paste_data;
        if (e && e.clipboardData && e.clipboardData.getData) { // Webkit - get data from clipboard, put into editdiv, cleanup, then cancel event
            if (/text\/html/.test(e.clipboardData.types)) {
                paste_data = e.clipboardData.getData('text/html');
            } else if (/text\/plain/.test(e.clipboardData.types)) {
                paste_data = e.clipboardData.getData('text/plain');
            } else {
                paste_data = "";
            }
            // build html from pasted data & parse it
            var html = $.parseHTML($('<div>').html(paste_data).html());
            $.each(html, function (i, el) {
                parsePaste(el);
            });

            // Prevent default paste !
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }
    Plugin.prototype.parsePaste = function(el) {
        if (el.nodeName === "#text") {
            insertTextAtCursor(el.nodeValue, null);
        } else if (el.nodeName === "SPAN" && el.className === 'tag') {
            insertTextAtCursor(el.innerText, el.dataset.value);
        } else {
            // walk down the tree
            if ($.parseHTML($(el).html()) !== null) {
                $.each($.parseHTML($(el).html()), function (i, subel) {
                    parsePaste(subel);
                });
            }
        }
    }

    Plugin.prototype.parseElement = function(el) {
        var output = "";

        if (el.nodeName === "#text") {
            output += el.nodeValue;
        } else if (el.nodeName === "SPAN" && el.className === 'tag') {
            output += el.dataset.value;
        } else {
            // walk down the tree
            if ($.parseHTML($(el).html()) !== null) {
                $.each($.parseHTML($(el).html()), function (i, subel) {
                    output += this.parseElement(subel);
                }.bind(this));
            }
        }
        return output;
    }


    Plugin.prototype.initComposer = function(text) {
        var composer = $('.hablou-editor');
        var reg = new RegExp("(<[^>]+>)+", "g");
        var text_items = text.split(reg);
        var self = this;
        // Reset composer and feed it !
        composer.html('');

        $.each(text_items, function(i, val) {
            if (val.indexOf("<") !== -1 && val.indexOf(">") !== -1) {
                // insert a tag
                if (self.settings.fields[val] !== undefined) {
                    // tag exists
                    composer.append(self.tag(self.settings.fields[val], val));
                    //html_content.append(tag('toto', 'val'));
                }
            } else {
                // Not a tag, insert as it is
                composer.append(val);
            }
        });
    }
    Plugin.prototype.output = function() {
        var html = $.parseHTML($('.hablou-editor').html());
        var output = "";
        $.each(html, function (i, el) {
            output += this.parseElement(el);
        }.bind(this));
        return output
    }


    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        this.each(function() {
                if ( !$.data(this, pluginName)) {
                        $.data(this, pluginName, new Plugin(this, options));
                }
        });
        return this;
    };
})( jQuery, window, document );


