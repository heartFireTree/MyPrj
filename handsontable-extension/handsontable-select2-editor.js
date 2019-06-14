(function (Handsontable) {
    "use strict";

    var Select2Editor = Handsontable.editors.TextEditor.prototype.extend();

    Select2Editor.prototype.prepare = function (row, col, prop, td, originalValue, cellProperties) {

        Handsontable.editors.TextEditor.prototype.prepare.apply(this, arguments);

        this.options = {};

        if (this.cellProperties.select2Options) {
            this.options = $.extend(this.options, cellProperties.select2Options);
        }
    };

    Select2Editor.prototype.createElements = function () {
        this.$body = $(document.body);

        this.TEXTAREA = document.createElement('select');
        //this.TEXTAREA.setAttribute('type', 'text');
        this.$textarea = $(this.TEXTAREA);
        Handsontable.dom.addClass(this.TEXTAREA, 'handsontableInput');

        this.textareaStyle = this.TEXTAREA.style;
        this.textareaStyle.width = 0;
        this.textareaStyle.height = 0;

        this.TEXTAREA_PARENT = document.createElement('DIV');
        Handsontable.dom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

        this.textareaParentStyle = this.TEXTAREA_PARENT.style;
        this.textareaParentStyle.top = 0;
        this.textareaParentStyle.left = 0;
        this.textareaParentStyle.display = 'none';

        this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

        this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);

        var that = this;
        this.instance._registerTimeout(setTimeout(function () {
            that.refreshDimensions();
        }, 0));
    };

    var onSelect2Changed = function (val) {
        this.close();
        this.finishEditing();
    };
    var onSelect2Closed = function () {
        this.close();
        this.finishEditing();
    };
    var onBeforeKeyDown = function (event) {
        var instance = this;
        var that = instance.getActiveEditor();

        var keyCodes = Handsontable.helper.KEY_CODES;
        var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)


        //Process only events that have been fired in the editor
        if (!$(event.target).hasClass('select2-search__field')) {
            return;
        }
        if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
            //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
            event.stopImmediatePropagation();
            return;
        }

        var target = event.target;

        switch (event.keyCode) {
            case keyCodes.ARROW_RIGHT:
                if (Handsontable.dom.getCaretPosition(target) !== target.value.length) {
                    event.stopImmediatePropagation();
                } else {
                    that.$textarea.select2('close');
                }
                break;

            case keyCodes.ARROW_LEFT:
                if (Handsontable.dom.getCaretPosition(target) !== 0) {
                    event.stopImmediatePropagation();
                } else {
                    that.$textarea.select2('close');
                }
                break;

            case keyCodes.ENTER:
                var selected = that.instance.getSelected();
                var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
                if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
                    if (that.isOpened()) {
                        that.val(that.val() + '\n');
                        that.focus();
                    } else {
                        that.beginEditing(that.originalValue + '\n')
                    }
                    event.stopImmediatePropagation();
                }
                event.preventDefault(); //don't add newline to field
                break;

            case keyCodes.A:
            case keyCodes.X:
            case keyCodes.C:
            case keyCodes.V:
                if (ctrlDown) {
                    event.stopImmediatePropagation(); //CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
                }
                break;

            case keyCodes.BACKSPACE:
            case keyCodes.DELETE:
            case keyCodes.HOME:
            case keyCodes.END:
                event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
                break;
        }

    };

    Select2Editor.prototype.open = function (keyboardEvent) {
        this.refreshDimensions();
        this.textareaParentStyle.display = 'block';
        this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

        this.$textarea.css({
            height: $(this.TD).height() + 4,
            width: $(this.TD).outerWidth()
        });
        var self = this;
        console.log(self.options);
        self.$textarea.empty().show();
        self.$textarea.select2(self.options)
            .val(self.originalValue)
            .on('change', onSelect2Changed.bind(this))
            .on('select2-close', onSelect2Closed.bind(this))
        $(this.TEXTAREA_PARENT).find(".select2-selection__rendered").text($(self.TD).text());
        setTimeout(function () {
            self.$textarea.select2('open');

            $(".select2-search__field").on("keydown", function (e) {
                if (e.keyCode === Handsontable.helper.KEY_CODES.ENTER /*|| e.keyCode === Handsontable.helper.KEY_CODES.BACKSPACE*/) {
                    if ($(this).val()) {
                        e.preventDefault();
                        e.stopPropagation();
                    } else {
                        e.preventDefault();
                        e.stopPropagation();

                        self.close();
                        self.finishEditing();
                    }
                }
                //if (e.keyCode === Handsontable.helper.KEY_CODES.BACKSPACE) {
                //    //var txt = $(".select2-search__field").val();
                //    //$(".select2-search__field").val(txt.substr(0, txt.length - 1));
                //    var txt = $(".select2-search__field").find("input").val();
                //    $(".select2-search__field").val(txt.substr(0, txt.length - 1)).trigger("keyup.select2");
                //    e.preventDefault();
                //    e.stopPropagation();
                //}

                if (e.keyCode === Handsontable.helper.KEY_CODES.ARROW_DOWN || e.keyCode === Handsontable.helper.KEY_CODES.ARROW_UP) {
                    e.preventDefault();
                    e.stopPropagation();
                }

            });

            //setTimeout(function () {
            //    //$(".select2-search__field").focus();
            //    self.$textarea.trigger("select2:activate").focus();
            //    if (keyboardEvent && keyboardEvent.keyCode && keyboardEvent.keyCode != 113) {
            //        var key = keyboardEvent.keyCode;
            //        var keyText = (String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key)).toLowerCase();

            //        $(self.TEXTAREA_PARENT).find("input").val(keyText).trigger("keyup.select2");
            //        //self.$textarea.trigger("chosen:activate");
            //    }
            //})

        }, 1);
    };

    Select2Editor.prototype.init = function () {
        Handsontable.editors.TextEditor.prototype.init.apply(this, arguments);
    };

    Select2Editor.prototype.close = function () {
        this.instance.listen();
        this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
        //this.$textarea.off('select2:select');
        this.$textarea.off();
        this.$textarea.hide();
        Handsontable.editors.TextEditor.prototype.close.apply(this, arguments);
    };

    Select2Editor.prototype.val = function (value) {
        if (typeof value == 'undefined') {
            return this.$textarea.val();
        } else {
            this.$textarea.val(value);
        }
    };


    Select2Editor.prototype.focus = function () {

        this.instance.listen();

        // DO NOT CALL THE BASE TEXTEDITOR FOCUS METHOD HERE, IT CAN MAKE THIS EDITOR BEHAVE POORLY AND HAS NO PURPOSE WITHIN THE CONTEXT OF THIS EDITOR
        //Handsontable.editors.TextEditor.prototype.focus.apply(this, arguments);
    };

    Select2Editor.prototype.beginEditing = function (initialValue) {
        var onBeginEditing = this.instance.getSettings().onBeginEditing;
        if (onBeginEditing && onBeginEditing() === false) {
            return;
        }

        Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

    };

    Select2Editor.prototype.finishEditing = function (isCancelled, ctrlDown) {
        this.instance.listen();
        return Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
    };

    Handsontable.editors.Select2Editor = Select2Editor;
    Handsontable.editors.registerEditor('select2', Select2Editor);

})(Handsontable);