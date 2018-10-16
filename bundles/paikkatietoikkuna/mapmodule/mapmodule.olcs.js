import {defaults as olInteractionDefaults} from 'ol/interaction';
import olView from 'ol/View';
import * as olProj from 'ol/proj';
import olMap from 'ol/Map';
import {defaults as olControlDefaults} from 'ol/control';
import OLCesium from 'ol-cesium';
import MapModuleOl from '../../mapping/mapmodule/MapModule.ol';
import 'ol-cesium/css/olcs.css';

const TERRAIN_SERVICE_URL = 'https://beta-karttakuva.maanmittauslaitos.fi/hmap/';

class MapModuleOlCesium extends MapModuleOl {
    constructor (id, imageUrl, options, mapDivId) {
        super(id, imageUrl, options, mapDivId);
        this._map3d = null;
        this._mapReady = false;
        this._mapReadySubscribers = [];
        this._lastKnownZoomLevel = null;
    }

    /**
     * @method createMap
     * Creates OlCesium map implementation
     * @return {ol/Map}
     */
    createMap () {
        var me = this;
        // this is done BEFORE enhancement writes the values to map domain
        // object... so we will move the map to correct location
        // by making a MapMoveRequest in application startup      
        var controls = olControlDefaults({
            zoom: false,
            attribution: false,
            rotate: false
        });

        var map = new olMap({
            keyboardEventTarget: document,
            target: this.getMapElementId(),
            controls: controls,
            interactions: me._olInteractionDefaults,
            loadTilesWhileInteracting: true,
            loadTilesWhileAnimating: true,
            moveTolerance: 2
        });

        var projection = olProj.get(me.getProjection());
        map.setView(new olView({
            projection: projection,
            // actual startup location is set with MapMoveRequest later on
            // still these need to be set to prevent errors
            center: [0, 0],
            zoom: 0,
            resolutions: this.getResolutionArray()
        }));

        me._setupMapEvents(map);

        this._map3d = new OLCesium({
            map: map,
            sceneOptions: {
                showCredit: false
            }
        });

        var scene = this._map3d.getCesiumScene();
        var terrainProvider = new Cesium.CesiumTerrainProvider({
            url: TERRAIN_SERVICE_URL
        });
        terrainProvider.readyPromise.then(() => {
            scene.terrainProvider = terrainProvider;
        });

        var updateReadyStatus = function () {
            scene.postRender.removeEventListener(updateReadyStatus);
            me._mapReady = true;
            me._notifyMapReadySubscribers();
        };
        scene.postRender.addEventListener(updateReadyStatus);

        return map;
    }

    /**
     * Fire operations that have been waiting for the map to initialize.
     */
    _notifyMapReadySubscribers () {
        var me = this;
        this._mapReadySubscribers.forEach(function (fireOperation) {
            fireOperation.operation.apply(me, fireOperation.arguments);
        });
    }

    getMapZoom () {
        var zoomlevel = this.getMap().getView().getZoom();
        if (typeof (zoomlevel) === 'undefined') {
            // Cesium view has been zoomed outside ol zoomlevels.
            zoomlevel = this._lastKnownZoomLevel;
        } else {
            this._lastKnownZoomLevel = Math.round(zoomlevel);
        }
        return Math.round(zoomlevel);
    }

    /**
     * @param {Object} layerImpl ol/layer/Layer or Cesium.Cesium3DTileset, olcs specific!
     * @param {Boolean} toBottom if false or missing adds the layer to the top, if true adds it to the bottom of the layer stack
     */
    addLayer (layerImpl, toBottom) {
        if (!layerImpl) {
            return;
        }
        if (layerImpl instanceof Cesium.Cesium3DTileset) {
            this._map3d.getCesiumScene().primitives.add(layerImpl);
        } else {
            this.getMap().addLayer(layerImpl);
            // check for boolean true instead of truthy value since some calls might send layer name as second parameter/functionality has changed
            if (toBottom === true) {
                this.setLayerIndex(layerImpl, 0);
            }
        }
    }

    /**
     * @param {Object} layerImpl ol/layer/Layer or Cesium.Cesium3DTileset, olcs specific!
     */
    removeLayer (layerImpl) {
        if (!layerImpl) {
            return;
        }
        if (layerImpl instanceof Cesium.Cesium3DTileset) {
            layerImpl.destroy();
        } else {
            this.getMap().removeLayer(layerImpl);
            if (typeof layerImpl.destroy === 'function') {
                layerImpl.destroy();
            }
        }
    }

    /**
     * Set
     * @param {boolean} mode drawing mode on or off!
     */
    setDrawingMode (mode) {
        this.isDrawing = !!mode;
        this.set3dEnabled(!this.isDrawing);
    }

    /**
     * Enable 3d view.
     */
    set3dEnabled (enable) {
        if (enable === this._map3d.getEnabled()) {
            return;
        }
        var map = this.getMap();
        var interactions = null;
        if (enable) {
            // Remove all ol interactions before switching to 3d view.
            // Editing interactions after ol map is hidden doesn't work.
            interactions = map.getInteractions();
            if (interactions) {
                var removals = [];
                interactions.forEach(function (cur) {
                    removals.push(cur);
                });
                removals.forEach(function (cur) {
                    map.removeInteraction(cur);
                });
            }
        } else {
            // Add default interactions to 2d view.
            interactions = olInteractionDefaults({
                altShiftDragRotate: false,
                pinchRotate: false
            });
            interactions.forEach(function (cur) {
                map.addInteraction(cur);
            });
        }
        this._map3d.setEnabled(enable);
    }

    /**
     * Returns camera's position and orientation for state saving purposes.
     */
    getCamera () {
        var view = {};
        var olcsCam = this._map3d.getCamera();
        var coords = olcsCam.getPosition();
        view.location = {
            x: coords[0],
            y: coords[1],
            altitude: olcsCam.getAltitude()
        };
        var sceneCam = this._map3d.getCesiumScene().camera;
        view.orientation = {
            heading: Cesium.Math.toDegrees(sceneCam.heading),
            pitch: Cesium.Math.toDegrees(sceneCam.pitch),
            roll: Cesium.Math.toDegrees(sceneCam.roll)
        };
        return view;
    }

    /**
     * Turns on 3D view and positions the camera.
     *
     * Options example:
     * Camera location in map projection coordinates (EPSG:3857)
     * Orientation values in degrees
     * {
            location: {
                x: 2776460.39,
                y: 8432972.40,
                altitude: 1000.0 //meters
            },
            orientation: {
                heading: 90.0,  // east, default value is 0.0 (north)
                pitch: -90,     // default value (looking down)
                roll: 0.0       // default value
            }
        * }
        */
    setCamera (options) {
        this.set3dEnabled(true);
        if (this._mapReady) {
            if (options) {
                var camera = this._map3d.getCesiumScene().camera;
                var view = {};
                if (options.location) {
                    var pos = options.location;
                    var lonlat = olProj.transform([pos.x, pos.y], this.getProjection(), 'EPSG:4326');
                    view.destination = Cesium.Cartesian3.fromDegrees(lonlat[0], lonlat[1], pos.altitude);
                }
                if (options.orientation) {
                    view.orientation = {
                        heading: this._toRadians(options.orientation.heading),
                        pitch: this._toRadians(options.orientation.pitch),
                        roll: this._toRadians(options.orientation.roll)
                    };
                }
                camera.setView(view);
                this._map3d.getCamera().updateView();
                this.updateDomain();
            }
        } else {
            // Cesium is not ready yet. Fire after it has been initialized properly.
            this._mapReadySubscribers.push({
                operation: this.setCamera,
                arguments: [options]
            });
        }
    }

    _toRadians (value) {
        return !isNaN(value) ? Cesium.Math.toRadians(value) : undefined;
    }

    /**
     * Returns state for mapmodule including plugins that have getState() function
     * @method getState
     * @return {Object} properties for each pluginName
     */
    getState () {
        var state = {
            plugins: {}
        };
        var pluginName;

        for (pluginName in this._pluginInstances) {
            if (this._pluginInstances.hasOwnProperty(pluginName) && this._pluginInstances[pluginName].getState) {
                state.plugins[pluginName] = this._pluginInstances[pluginName].getState();
            }
        }
        if (this._map3d.getEnabled()) {
            state.camera = this.getCamera();
        }
        return state;
    }

    /**
     * Returns state for mapmodule including plugins that have getStateParameters() function
     * @method getStateParameters
     * @return {String} link parameters for map state
     */
    getStateParameters () {
        var params = '';
        var pluginName;

        if (this._map3d.getEnabled()) {
            var cam = this.getCamera();
            params +=
                '&cam=' + cam.location.x.toFixed(0) +
                '_' + cam.location.y.toFixed(0) +
                '_' + cam.location.altitude.toFixed(0) +
                '_' + cam.orientation.heading.toFixed(2) +
                '_' + cam.orientation.pitch.toFixed(2) +
                '_' + cam.orientation.roll.toFixed(2);
        }

        for (pluginName in this._pluginInstances) {
            if (this._pluginInstances.hasOwnProperty(pluginName) && this._pluginInstances[pluginName].getStateParameters) {
                params = params + this._pluginInstances[pluginName].getStateParameters();
            }
        }
        return params;
    }

    /**
     * Creates style based on JSON
     * @return {Cesium.Cesium3DTileStyle} style Cesium specific!
     */
    get3DStyle (styleDef, opacity) {
        if (!styleDef) {
            return;
        }
        var style = jQuery.extend(true, {}, styleDef);
        var cesiumStyle = new Cesium.Cesium3DTileStyle();
        // Set light brown default color;
        var color = '#ffd2a6';
        if (Oskari.util.keyExists(style, 'fill.color')) {
            color = style.fill.color;
            if (style.effect) {
                switch (style.effect) {
                case 'darken' : color = Oskari.util.alterBrightness(color, -50); break;
                case 'lighten' : color = Oskari.util.alterBrightness(color, 50); break;
                }
            }
            if (color.indexOf('rgb(') > -1) {
                // else check at if color is rgb
                color = '#' + Oskari.util.rgbToHex(color);
            }
        }

        opacity = opacity === undefined ? 1 : opacity;
        if (opacity > 1) {
            opacity = opacity / 100.0;
        }
        cesiumStyle.color = `color('${color}', ${opacity})`;

        if (Oskari.util.keyExists(style, 'image.sizePx')) {
            cesiumStyle.pointSize = `${styleDef.image.sizePx}`;
        }
        return cesiumStyle;
    }
}

Oskari.clazz.defineES(
    'Oskari.mapframework.ui.module.common.MapModule',
    MapModuleOlCesium,
    {
        /**
         * @property {String[]} protocol
         * @static
         */
        'protocol': ['Oskari.mapframework.module.Module']
    }
);
