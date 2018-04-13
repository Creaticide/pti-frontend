Oskari.clazz.define('Oskari.coordinatetransformation.view.FileHandler',
    function (dataHandler, loc, flag) {
        var me = this;
        Oskari.makeObservable(this);
        me.dataHandler = dataHandler;
        me.loc = loc;
        me.element = null;
        me.flag = flag;
        me._template = {
            settings: _.template(' <div class="oskari-coordinate-form">' +
                                    '<% if (typeof(filename) !== "undefined") { %> '+
                                        '<div class="fileRow"> <b class="title">${filename}</b> <input id="filename" type="text"> </div>'+
                                    '<% } %>'+            
                                    '<div class="formatRow"> '+
                                    '<b class="title">${format}</b> '+
                                    '<div class="settingsSelect">'+
                                        '<select id="unit">'+
                                            '<option value="degree">${degree}</option>'+
                                            '<option value="gradian">${gradian}</option>'+
                                            '<option value="radian">${radian}</option>'+
                                            '<option value="DDD.dd">DDD.dd</option>'+
                                            '<option value="DD MM SS.ss">DD MM SS.ss</option>'+
                                            '<option value="DD MM.mm">DD MM.mm</option>'+
                                            '<option value="DDMMSS.ss">DDMMSS.ss</option>'+
                                            '<option value="DDMM.mm">DDMM.mm</option>'+
                                        '</select>'+
                                    '</div>'+
                                    '<label class="lbl"><input id="prefixId" class="chkbox" type="checkbox">${id}</label>'+
                                '</div>'+
                                '<div class="decimalSeparator"> '+
                                    '<b class="title">${decimalseparator}</b> '+
                                    '<div class="settingsSelect">'+
                                        '<select id="decimalseparator">'+
                                            '<option value="point">${point}</option>'+
                                            '<option value="comma">${comma}</option>'+
                                        '</select>'+
                                    '</div>' +
                                    '<label class="lbl"> <input id="reversecoordinates" class="chkbox" type="checkbox"> ${reversecoords}</label> '+
                                '</div>' +
                                '<div class="headerLineCount"> '+
                                    '<b class="title">${headercount}</b>'+
                                    '<input id="headerrow" type="number"> '+
                                '</div>'+
                                    '<input id="overlay-btn" class="cancel" type="button" value="${cancel} " />' +
                                    '<% if(typeof(fileExport) !== "undefined") { %>'+
                                        '<input id="overlay-btn" class="done" type="button" value="${fileExport}" />'+
                                    '<% } else { %>'+
                                        '<input id="overlay-btn" class="done" type="button" value="${done}" />' +
                                    '<% } %>' +
                                '</div>' +
                                '</div>'
                                )
        } 
    }, {
        getElement: function() {
            return this.element;
        },
        setElement: function( el ) {
            this.element = jQuery(el);
        },
        getName: function() {
            return 'Oskari.coordinatetransformation.view.FileHandler';
        },
        create: function() {
            var fileSettings;
            if ( this.flag === "export" ) {
                fileSettings = this._template.settings({
                    //title: this.loc('fileSettings.export.title'),
                    fileName: this.loc('fileSettings.export.filename'),
                    //fileExport: this.loc('fileSettings'),
                    format: this.loc('fileSettings.options.format'),
                    decimalseparator: this.loc('fileSettings.options.decimalSeparator'),
                    id: this.loc('fileSettings.options.useId'),
                    reversecoords: this.loc('fileSettings.options.reverseCoords'),
                    headercount: this.loc('fileSettings.options.headerCount'),
                    cancel: this.loc('actions.cancel'),
                    done: this.loc('actions.done'),
                    degree: this.loc('fileSettings.options.degree'),
                    gradian: this.loc('fileSettings.options.gradian'),
                    radian: this.loc('fileSettings.options.radian'),
                    point: this.loc('fileSettings.options.point'),
                    comma: this.loc('fileSettings.options.comma')
                });
            } else {
                fileSettings = this._template.settings({
                    //title: this.loc('fileSettings.import.title'),
                    //fileExport: this.loc('fileSettings'),
                    format: this.loc('fileSettings.options.format'),
                    decimalseparator: this.loc('fileSettings.options.decimalSeparator'),
                    id: this.loc('fileSettings.options.useId'),
                    reversecoords: this.loc('fileSettings.options.reverseCoords'),
                    headercount: this.loc('fileSettings.options.headerCount'),
                    cancel: this.loc('actions.cancel'),
                    done: this.loc('actions.done'),
                    degree: this.loc('fileSettings.options.degree'),
                    gradian: this.loc('fileSettings.options.gradian'),
                    radian: this.loc('fileSettings.options.radian'),
                    point: this.loc('fileSettings.options.point'),
                    comma: this.loc('fileSettings.options.comma')
                });
            }

            this.setElement( fileSettings );
        },
        createEventHandlers: function ( dialog ) {
            var me = this;
            jQuery( '.oskari-coordinate-form' ).on('click', '.done', function () {
                me.trigger('GetSettings', me.getFormSelections() );
                dialog.close();
            });

            jQuery( '.oskari-coordinate-form' ).on('click', '.cancel', function () {
                dialog.close();
            });
        },
        /**
         * @method getFormSelections
         */
        getFormSelections: function () {
            var element = jQuery('.oskari-coordinate-form');
            var settings = {
                filename: element.find('#filename').val(),
                unit: element.find('#unit option:checked').val(),
                decimalSeparator: element.find('#decimalseparator option:checked').val(),
                prefixId: element.find('#prefixId').is(":checked"),
                axisFlip: element.find('#reversecoordinates').is(":checked"),
                headerLineCount: element.find('#headerrow').val(),
            }
            return settings;
        },
        showFileDialogue: function() {
            var dialog = Oskari.clazz.create('Oskari.userinterface.component.Popup');
            var title = this.flag === "import" ? this.loc('fileSettings.import.title') : this.loc('fileSettings.export.title');
            dialog.makeDraggable();
            dialog.createCloseIcon();
            dialog.show(title, jQuery( this.getElement() ));
            this.createEventHandlers( dialog );
        },
        exportFile: function ( settings ) {
            var exportArray = [];
            //this.dataHandler.getCoordinateObject().forEach( function ( pair ) {
            //    exportArray.push( pair.input );
            //});  
            if( exportArray.length !== 0 ) {
                this.fileInput.exportToFile( exportArray, settings.filename+'.txt' );
            } else {
                Oskari.log(this.getName()).warn("No transformed coordinates to write to file!");
            }
        }
    }
);
 