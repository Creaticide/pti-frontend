Oskari.clazz.define('Oskari.coordinatetransformation.component.SourceSelect',
    function (loc) {
        var me = this;
        me.loc = loc;
        this.element = null;
        me._template = {
            sourceWrapper: jQuery('<div class="sourceWrapper"></div>'),
            source: _.template(
                '<div class="coordinate-datasource"> </br> ' +
                    '<h4>${title}</h4>'+
                    '<form>'+
                        '<input type="radio" id="clipboard" name="load" value="keyboard">' +
                        '<label for="clipboard">' +
                            '<span/>' +
                            '${clipboard}' +
                        '</label>'+
                        '<input type="radio" id="file" name="load" value="file">' +
                        '<label for="file">' +
                            '<span/>' +
                            '${file}' +
                        '</label>'+
                        '<input type="radio" id="mapselection" name="load" value="map">' +
                        '<label for="mapselection">' +
                            '<span/>' +
                            '${map}' +
                        '</label>'+
                    '</form>'+
                '</div>'
            ),
            info: _.template(
                '<div class="datasource-info">' +
                    '<div class="coordinateconversion-clipboardinfo" style=display:none;">'+
                        '<div class="clipboardinfo">' +
                            '<i>${clipboardupload}<i>' +
                        '</div>'+
                    '</div>' +
                    '<div class="coordinateconversion-mapinfo" style=display:none;">'+
                        '<div class="mapinfo">'+
                            '<i>${mapInfo}<i> </br>'+
                            '<input type="button" class="selectFromMap" name="load" value="${mapButton}">' +
                        '</div>' +
                    '</div>' +
                '</div>'
            )
        }
        this.createUi();
    }, {
        getName: function() {
            return 'Oskari.coordinatetransformation.components.SourceSelect';
        },
        setElement: function (el) {
            this.element = el;
        },
        getElement: function () {
            return this.element;
        },
        createUi: function () {
            if (this.element !== null) {
                return;
            }
            var wrapper = this._template.sourceWrapper.clone();

            var source = this._template.source({    
                title: this.loc('flyout.dataSource.title'),
                file: this.loc('flyout.dataSource.file.label'),
                clipboard: this.loc('flyout.dataSource.keyboard.label'),
                //choose: this.loc('flyout.dataSource.file.label'),
                map: this.loc('flyout.dataSource.map.label')
            });
            var info = this._template.info({ 
                clipboardupload:this.loc('flyout.dataSource.keyboard.info'),
                mapInfo: this.loc('flyout.dataSource.map.info'),
                mapButton: this.loc('actions.select')
            });
            wrapper.append(source);
            wrapper.append(info);
            wrapper.find('.selectFromMap').addClass('primary');
            this.setElement(wrapper);
        }
    }
);
 