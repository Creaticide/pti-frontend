/**
 * @class Oskari.mapframework.bundle.routesearch.Flyout
 *
 * Renders the "route search" flyout.
 */
Oskari.clazz.define('Oskari.mapframework.bundle.routesearch.Flyout',
    function () {
        this.fields = ['from', 'to'];
        this.state = {};
        this.fromLonLat = {};
        this.toLonLat = {};
        this.locations = [];
        this.services = [];
        this.container = null;
        this._templates = {};
        this._mapmodule = this.instance.sandbox.findRegisteredModuleInstance('MainMapModule');
        this._templates.main =
            '<div>' +
            '</div>' +
            '<div>' +
            '    <strong></strong>' +
            '    <ul></ul>' +
            '</div>' +
            '<div></div>';
        this.mapEl = this.instance.sandbox.findRegisteredModuleInstance(
            'MainMapModule'
        ).getMapEl();
    }, {

        /**
         * @method getName
         */
        getName: function () {
            return 'Oskari.mapframework.bundle.routesearch.Flyout';
        },

        /**
         * @method _getSearchSuggestions
         * @private
         * @param {jQuery} field    JQuery UI autocomplete object
         * @param {Object} request  Request
         * @param {Object} response Response
         */
        _getSearchSuggestions: function (field, request, response) {
            var me = this;
            var fieldName = field.element[0].name;
            me.state[fieldName] = {
                name: request.term
            };

            me._updateRoutingLinks();

            if (request.term && request.term.length) {
                me.service.doSearch(
                    request.term,
                    function (data) {
                        // onSuccess
                        var value = data && data.totalCount ? data.locations : [];
                        me.locations = value;
                        response(value);
                    },
                    function () {}
                );
            }
        },

        /**
         * @method _setSearchLocation
         * @private
         * @param {jQuery} field Input field
         * @param {Event}  event Event
         * @param {jQuery} ui    JQuery UI autocomplete object
         */
        _setSearchLocation: function (field, event, ui) {
            var me = this;
            var fieldName = field.attr('name');
            var a = jQuery('<a>');
            var item = {
                name: a.html(ui.item.name).text(),
                village: a.html(ui.item.village).text()
            };
            me.state[fieldName] = item;
            field.val(item.name + ', ' + item.village);
            me.bindLocation(me.locations);
            me._updateRoutingLinks();
        },

        /**
         * @method _reverseGeoCode
         * @private
         * @param {String}            field  Active field name
         * @param {OpenLayers.LonLat} lonLat Location
         */
        _reverseGeoCode: function (field, lonLat) {
            // not implemented
        },
        bindLocation: function (location) {
            var me = this;

            location.forEach(function (loc) {
                if (typeof me.state.from !== 'undefined') {
                    if (loc.name === me.state.from.name && loc.village === me.state.from.village) {
                        var fromLonLat = me._mapmodule.transformCoordinates({ lon: loc.lon, lat: loc.lat }, me._mapmodule.getProjection(), 'EPSG:4326');
                        me.fromLonLat = fromLonLat;
                    }
                }
                if (typeof me.state.to !== 'undefined') {
                    if (loc.name === me.state.to.name && loc.village === me.state.to.village) {
                        var toLonLat = me._mapmodule.transformCoordinates({ lon: loc.lon, lat: loc.lat }, me._mapmodule.getProjection(), 'EPSG:4326');
                        me.toLonLat = toLonLat;
                    }
                }
            });
        },

        /**
         * @method disableMapClick
         */
        disableMapClick: function () {
            var me = this;
            delete me.state.field;
            me.mapEl.removeClass('cursor-crosshair');
            me.instance.unregisterMapClickHandler();
        },

        /**
         * @method onMapClick
         * @param {OpenLayers.LonLat} lonLat Click location
         */
        onMapClick: function (lonLat) {
            var me = this;
            if (me.state.field) {
                me._reverseGeoCode(me.state.field, lonLat);
                me.disableMapClick();
            }
        },

        /**
         * @method _fromMapButtonHandler
         * @private
         * @param {String} field Active field name
         * @param {Event}  event Map click event
         */
        _fromMapButtonHandler: function (field, event) {
            var me = this;
            if (me.state.field === field) {
                // Deselect target on second click
                me.disableMapClick();
            } else {
                me.state.field = field;
                me.instance.registerMapClickHandler();
                me.mapEl.addClass('cursor-crosshair');
            }
        },
        setEl: function (el, flyout) {
            this.container = jQuery(el[0]);
            this.container.addClass('routesearch');
            flyout.addClass('routesearch');
        },
        /**
         * @method startPlugin
         * called by host to start flyout operations
         */
        startPlugin: function () {
            var me = this;
            var ajaxUrl = null;
            var contents = jQuery(me._templates.main);
            var i;
            var field;
            var fields = me.fields;
            var tmp;

            if (me.instance.conf && me.instance.conf.url) {
                ajaxUrl = me.instance.conf.url;
            }

            me.service = Oskari.clazz.create('Oskari.service.search.SearchService', me.getSandbox(), ajaxUrl);

            contents.eq(1).find('strong').html(me.locale.routingService);

            for (i = 0; i < fields.length; i++) {
                field = fields[i];
                tmp = Oskari.clazz.create(
                    'Oskari.userinterface.component.FormInput',
                    field
                );
                tmp.addClearButton();
                tmp.setFloatingLabel(me.locale[field]);

                tmp.getField().find('input[type=text]').autocomplete({
                    delay: 300,
                    minLength: 0,
                    select: function (event, ui) {
                        event.preventDefault();
                        me._setSearchLocation(jQuery(this), event, ui);
                    },
                    source: function (request, response) {
                        me._getSearchSuggestions(this, request, response);
                    }
                }).data('ui-autocomplete')._renderItem = me._renderAutocompleteItem;

                contents.eq(0).append(tmp.getField());
                tmp = Oskari.clazz.create(
                    'Oskari.userinterface.component.Button'
                );
                tmp.setTitle(me.locale.fromMap);

                tmp.setHandler(function (event) {
                    me._fromMapButtonHandler(field, event);
                });
            }

            this.container.append(contents);
            me._initRoutingServices();
            me._updateRoutingLinks(true);
        },
        _renderAutocompleteItem: function (ul, item) {
            var li = jQuery('<li>');
            var a = jQuery('<a href="#">');
            a.html(item.name + ', ' + item.village);
            li.append(a);
            ul.append(li);
            return li;
        },
        /**
         * @method _initRoutingServices
         * @private
         */
        _initRoutingServices: function () {
            var me = this;
            me.services.push(
                me._routingService(
                    'Matka.fi',
                    '#1A88CC',
                    me._matkaFiURLBuilder
                )
            );

            me.services.push(
                me._routingService(
                    'Google Maps',
                    '#88BE44',
                    me._googleMapsURLBuilder
                )
            );

            me.services.push(
                me._routingService(
                    'HERE',
                    '#124191',
                    me._hereURLBuilder
                )
            );

            me.services.push(
                me._routingService(
                    '02.fi',
                    '#F93F31',
                    me._fonectaURLBuilder
                )
            );
        },

        /**
         * @method _matkaFiURLBuilder
         * Builds URL for matka.fi routing service
         * @private
         */
        _matkaFiURLBuilder: function (fromLoc, toLoc) {
            var me = this;
            var url = 'http://opas.matka.fi/reitti/';
            url += fromLoc.name;
            if (fromLoc.village) {
                url += '%2C%20' + fromLoc.village + '%3A%3A' + me.fromLonLat.lat + '%2C' + me.fromLonLat.lon;
            }
            url += '/' + toLoc.name;
            if (toLoc.village) {
                url += '%2C%20' + toLoc.village + '%3A%3A' + me.toLonLat.lat + '%2C' + me.toLonLat.lon;
            }
            /* Ugly ISO-8859-1 encode,
             * replace with a lib if need be.
             */
            // url = url.replace('Å', '%C5')
            //     .replace('å', '%E5')
            //     .replace('Ä', '%C4')
            //     .replace('ä', '%E4')
            //     .replace('Ö', '%D6')
            //     .replace('ö', '%F6')
            //     .replace('é', '%E9')
            //     .replace('É', '%C9')
            //     .replace('ü', '%FC')
            //     .replace('Ü', '%DC')
            //     .replace('\'', '%27')
            //     .replace(',', '%2C');

            return url;
        },
        /**
         * @method _googleMapsURLBuilder
         * Builds URL for google maps routing service
         * @private
         */
        _googleMapsURLBuilder: function (fromLoc, toLoc) {
            var url = 'https://www.google.fi/maps/dir/';
            url += encodeURIComponent(fromLoc.name);
            if (fromLoc.village) {
                url += ',+' + encodeURIComponent(fromLoc.village);
            }
            url += ',+Finland';
            url += '/' + encodeURIComponent(toLoc.name);
            if (toLoc.village) {
                url += ',+' + encodeURIComponent(toLoc.village);
            }
            url += ',+Finland';
            return url;
        },
        /**
         * @method _hereURLBuilder
         * Builds URL for Nokia Here routing service
         * @private
         */
        _hereURLBuilder: function (fromLoc, toLoc) {
            var url = 'http://here.com/directions/drive/';
            url += fromLoc.name.replace(' ', '_');
            if (fromLoc.village) {
                url += ',_' + fromLoc.village.replace(' ', '_');
            }
            url += ',_Finland';
            url += '/' + toLoc.name.replace(' ', '_');
            if (toLoc.village) {
                url += ',_' + toLoc.village.replace(' ', '_');
            }
            url += ',_Finland';
            return url;
        },
        /**
         * @method _matkaFiURLBuilder
         * Builds URL for 02.fi (fonecta) routing service
         * @private
         */
        _fonectaURLBuilder: function (fromLoc, toLoc) {
            var url = 'https://www.fonecta.fi/kartat?';
            url += 'from=' + encodeURIComponent(fromLoc.name);
            if (fromLoc.village) {
                url += ',' + encodeURIComponent(fromLoc.village);
            }
            url += '&to=' + encodeURIComponent(toLoc.name);
            if (toLoc.village) {
                url += ',' + encodeURIComponent(toLoc.village);
            }
            url += '&rt=fastest';
            return url;
        },

        /**
         * @method _routingService
         * @private
         * @param {String}   name       Service name
         * @param {String}   color      Service color (used for the button)
         * @param {Function} urlBuilder Function (fromLoc, toLoc)
         */
        _routingService: function (name, color, urlBuilder) {
            var me = this;
            var ret = {
                name: name,
                color: color,
                urlBuilder: urlBuilder,
                getButton: function (fromLoc, toLoc) {
                    var el = this.el;

                    if (!el) {
                        el = jQuery(
                            '<a class="button">' + this.name + '</a>'
                        );
                        this.el = el;
                    }
                    if (me._locationOk(fromLoc) && me._locationOk(toLoc)) {
                        el
                            .attr('href', this.urlBuilder(fromLoc, toLoc))
                            .attr('target', '_blank')
                            .removeClass('disabled')
                            .css('background-color', this.color)
                            .prop('title', this.name)
                            .off('click');
                    } else {
                        el
                            .attr('href', '#')
                            .removeAttr('target')
                            .addClass('disabled')
                            .css('background-color', '')
                            .prop('title', me.locale.selectLocations)
                            .on('click',
                                function (event) {
                                    event.preventDefault();
                                    return false;
                                }
                            );
                    }
                    return el;
                }
            };
            return ret;
        },
        /**
         * @method _locationOk
         * Checks that the location object isn't empty
         * @private
         * @param {object} loc Locationobject to verify
         */
        _locationOk: function (loc) {
            return loc && loc.name && loc.name.length;
        },
        /**
         * @method _updateRoutingLinks
         * @private
         * @param {Boolean} createButtons Should the buttons be appended to ui
         */
        _updateRoutingLinks: function (createButtons) {
            var me = this;
            var button;
            var locations = [];
            var routingService;
            var i;

            for (i = 0; i < me.fields.length; i++) {
                locations.push(me.state[me.fields[i]]);
            }

            for (i = 0; i < me.services.length; i++) {
                routingService = me.services[i];
                if (routingService.name === 'Matka.fi') {
                    routingService.fromLonLat = me.fromLonLat;
                    routingService.toLonLat = me.toLonLat;
                }
                button = routingService.getButton.apply(
                    routingService,
                    locations
                );
                if (createButtons) {
                    this.container.find('ul').append(
                        jQuery('<li>').append(button)
                    );
                }
            }
        }
    }, {
        extend: ['Oskari.userinterface.extension.DefaultFlyout']
    }
);
