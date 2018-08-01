/**
 * @class Oskari.arcgis.bundle.maparcgis.plugin.ArcGisLayerPlugin
 * Provides functionality to draw Stats layers on the map
 */
Oskari.clazz.define('Oskari.map3dtiles.bundle.tiles3d.plugin.Tiles3DLayerPlugin',

    /**
     * @method create called automatically on construction
     * @static
     */

    function () {
    }, {
        __name: 'Tiles3DLayerPlugin',
        _clazz: 'Oskari.map3dtiles.bundle.tiles3d.plugin.Tiles3DLayerPlugin',
        layerType: 'tiles3d',

        /**
         * Checks if the layer can be handled by this plugin
         * @method  isLayerSupported
         * @param  {Oskari.mapframework.domain.AbstractLayer}  layer
         * @return {Boolean}       true if this plugin handles the type of layers
         */
        isLayerSupported: function (layer) {
            if (!layer) {
                return false;
            }
            return layer.isLayerOfType(this.layerType);
        },
        /**
         * @private @method _initImpl
         * Interface method for the module protocol.
         */
        _initImpl: function () {
            // register domain builder
            var mapLayerService = this.getSandbox().getService('Oskari.mapframework.service.MapLayerService');
            if (mapLayerService) {
                mapLayerService.registerLayerModel(
                    'tiles3dlayer',
                    'Oskari.map3dtiles.bundle.tiles3d.domain.Tiles3DLayer'
                );
                this._extendCesium3DTileset();
            }
        },
        /**
         * @private @method _extendCesium3DTileset
         * Extend Cesium3DTileset with ol layer functions.
         */
        _extendCesium3DTileset: function () {
            var proto = Cesium.Cesium3DTileset.prototype;
            proto.setVisible = function (visible) {
                this.show = visible === true;
            };
            proto.isVisible = proto.getVisible = function () {
                return this.show === true;
            };
            proto.setOpacity = function (opacity) {
                if (!isNaN(opacity)) {
                    this._color = this._color || '#FFFFFF';

                    var colorDef = 'color("' + this._color + '", ' + opacity + ')';
                    this._opacity = opacity;
                    if (this.style) {
                        this.style.color = colorDef;
                        this.makeStyleDirty();
                    } else {
                        this.style = new Cesium.Cesium3DTileStyle({
                            color: colorDef
                        });
                    }
                }
            };
            proto.getOpacity = function () {
                if (this._opacity === null || this._opacity === undefined) {
                    return 100;
                }
                return this._opacity;
            };
        },
        /**
         * Adds a single 3d tileset to this map
         *
         * @method addMapLayerToMap
         * @param {Oskari.map3dtiles.bundle.tiles3d.domain.Tiles3DLayer} layer
         */
        addMapLayerToMap: function (layer) {
            var tileset = new Cesium.Cesium3DTileset({
                url: layer.getLayerUrls(),
                dynamicScreenSpaceError: true,
                dynamicScreenSpaceErrorDensity: 0.00278,
                dynamicScreenSpaceErrorFactor: 4.0,
                dynamicScreenSpaceErrorHeightFalloff: 0.25
            });

            this.getMapModule().add3DLayer(tileset);
            layer.setQueryable(false);

            // store reference to layers
            this.setOLMapLayers(layer.getId(), tileset);
        }
    }, {
        'extend': ['Oskari.mapping.mapmodule.AbstractMapLayerPlugin'],
        /**
         * @static @property {string[]} protocol array of superclasses
         */
        'protocol': [
            'Oskari.mapframework.module.Module',
            'Oskari.mapframework.ui.module.common.mapmodule.Plugin'
        ]
    });
