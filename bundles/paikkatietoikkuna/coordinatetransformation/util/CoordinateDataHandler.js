Oskari.clazz.define('Oskari.coordinatetransformation.CoordinateDataHandler', function (helper) {
    this.inputCoords = []; // [[1324, 12424]]
    this.resultCoords = []; // [[1324, 12424]]
    this.mapCoords = []; // [{id: "coord_marker_1", lon:123, lat:134}]
    this.mapCoordId = 0;
    this.helper = helper;
    Oskari.makeObservable(this);
}, {
    getName: function () {
        return 'Oskari.coordinatetransformation.CoordinateDataHandler';
    },
    getInputCoords: function () {
        return this.inputCoords;
    },
    addInputCoord: function (coord) {
        this.inputCoords.push(coord);
        // this.trigger('InputCoordAdded', coord);
        this.trigger('InputCoordsChanged', this.inputCoords);
    },
    setInputCoords: function (coords, suppressEvent) {
        this.inputCoords = coords;
        // don't render input table
        if (suppressEvent !== true) {
            this.trigger('InputCoordsChanged', coords);
        }
    },
    hasInputCoords: function () {
        return this.inputCoords.length !== 0;
    },
    getResultCoords: function () {
        return this.resultCoords;
    },
    hasResultCoords: function () {
        return this.resultCoords.length !== 0;
    },
    setResultCoords: function (coords) {
        this.resultCoords = coords;
        this.trigger('ResultCoordsChanged', coords);
    },
    getMapCoords: function () {
        return this.mapCoords;
    },
    setMapCoords: function (mapCoords) {
        this.mapCoords = mapCoords;
    },
    // Select from map
    addMapCoord: function (lonlat) {
        const id = 'coord_marker_' + this.mapCoordId;
        const coord = {
            lon: lonlat.lon,
            lat: lonlat.lat,
            id: id
        };
        this.mapCoordId++;
        this.mapCoords.push(coord);
        return id;
    },
    removeMapCoord: function (id) {
        const checkId = function (coord) {
            return coord.id !== id;
        };
        this.mapCoords = this.mapCoords.filter(checkId);
    },
    // add input coords as previously selected coordinates
    populateMapCoordsAndMarkers: function () {
        const me = this;
        const lonFirst = this.helper.getMapEpsgValues().lonFirst;
        const color = '#00ff00'; // add existing coords with different color
        let mapCoord;
        let markerId;
        let label;
        this.inputCoords.forEach(function (coord) {
            mapCoord = me.helper.getLonLatObj(coord, lonFirst);
            markerId = me.addMapCoord(mapCoord);
            label = me.helper.getLabelForMarker(mapCoord);
            me.helper.addMarkerForCoords(markerId, mapCoord, label, color);
        });
    },
    /**
     * @method validateData
     * check different conditions if data matches to them
     */
    validateData: function (data) {
        const lonlatKeyMatch = new RegExp(/(?:lon|lat)[:][0-9.]+[,].*,?/g);
        const numericWhitespaceMatch = new RegExp(/^[0-9.]+,+\s[0-9.]+,/gmi);

        const matched = data.match(lonlatKeyMatch);
        const numMatch = data.match(numericWhitespaceMatch);

        if (matched !== null) {
            return this.constructObjectFromRegExpMatch(matched, true);
        } else {
            if (numMatch !== null) {
                return this.constructObjectFromRegExpMatch(numMatch, false);
            }
        }
    },
    /**
     * @method constructObjectFromRegExpMatch
     * @description constructs a object from string with lon lat keys
     */
    constructObjectFromRegExpMatch: function (data, lonlat) {
        const matchLonLat = new RegExp(/(lon|lat)[:][0-9.]+[,]?/g);
        const matchNumericComma = new RegExp(/([0-9.])+\s*,?/g);
        const numeric = new RegExp(/[0-9.]+/);
        const array = [];
        let match;
        for (let i = 0; i < data.length; i++) {
            const lonlatObject = {};

            if (lonlat) {
                match = data[i].match(matchLonLat);
            } else {
                match = data[i].match(matchNumericComma);
            }
            const lonValue = match[0].match(numeric);
            const latValue = match[1].match(numeric);

            lonlatObject.lon = lonValue[0];
            lonlatObject.lat = latValue[0];
            array.push(lonlatObject);
        }
        return array;
    },
    /**
     * @method constructLonLatObjectFromArray
     * @description array -> object with lon lat keys
     */
    constructLonLatObjectFromArray: function (data) {
        const obj = {};
        if (Array.isArray(data)) {
            for (const i in data) {
                if (Array.isArray(data[i])) {
                    for (let j = 0; j < data[i].length; j++) {
                        obj[i] = {
                            lon: data[i][0],
                            lat: data[i][1]
                        };
                    }
                }
            }
        }
        return obj;
    },

    // generic -> to helper??
    // lonLatCoordToArray or addLonLatCoordToArray (array,..)
    lonLatCoordToArray: function (coord, lonFirst) {
        const arr = [];
        if (typeof coord.lon !== 'number' && typeof coord.lat !== 'number') {
            return arr;
        }
        if (lonFirst === true) {
            arr.push(coord.lon);
            arr.push(coord.lat);
        } else {
            arr.push(coord.lat);
            arr.push(coord.lon);
        }
        return arr;
    },
    // generic -> to helper??
    arrayCoordToLonLat: function (coord, lonFirst) {
        const obj = {};
        if (lonFirst === true) {
            obj.lon = coord[0];
            obj.lat = coord[1];
        } else {
            obj.lat = coord[0];
            obj.lon = coord[1];
        }
        return obj;
    },
    addMapCoordsToInput: function (addBln) {
        const mapCoords = this.getMapCoords();
        const coords = [];
        const lonFirst = this.helper.getMapEpsgValues().lonFirst;
        if (addBln === true) {
            for (let i = 0; i < mapCoords.length; i++) {
                coords.push(this.lonLatCoordToArray(mapCoords[i], lonFirst));
            }
            this.setInputCoords(coords);
        }
        // mapcoords is used only with select on map
        // reset always
        mapCoords.length = 0;
    },
    clearCoords: function () {
        this.inputCoords.length = 0;
        this.mapCoords.length = 0;
        this.resultCoords.length = 0;
        this.trigger('InputCoordsChanged', this.inputCoords);
        this.trigger('ResultCoordsChanged', this.resultCoords);
    },
    checkCoordsArrays: function () {
        const input = this.inputCoords.length;
        const result = this.resultCoords.length;
        if (input !== 0 && result !== 0) {
            return input === result;
        }
    }
    /**
     * @method modifyCoordinateObject
     * @param {string} flag - coordinate array contains two objects, input & output - flag determines which one you interact with
     * @param {array} coordinates - an array containing objects with keys lon lat - one object for each coordinate pair
     * @description
     *
    modifyCoordinateObject: function ( flag, coordinates ) {
        var data = this.getCoordinateObject().coordinates;
        var me = this;
        var actions = {
            'input': function () {
                coordinates.forEach( function ( pair ) {
                    data.push({
                        input: pair
                    });
                });
            },
            'output': function () {
                for ( var i = 0; i < Object.keys( coordinates ).length; i++ ) {
                    data[i].output = coordinates[i];
                }
            },
            'clear': function () {
                data.length = 0;
            }
        };
        if ( actions[flag] ) {
            actions[flag]();
        } else {
            return;
        }
    }, */
});
