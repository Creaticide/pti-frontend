/*
Ways to start the bundle in console:
* Oskari.app.playBundle(
    {
    bundlename : 'coordinatetransformation',
        metadata : {
            "Import-Bundle" : {
                "coordinatetransformation" : {
                    bundlePath : '/Oskari/packages/paikkatietoikkuna/bundle/'
                }
            }
        }
});
       var obj = {
            "bundlename":"coordinatetransformation" ,
            "metadata": {
                "Import-Bundle": { "coordinatetransformation": { "bundlePath": "/Oskari/packages/paikkatietoikkuna/bundle/" } }
            }
        }
        appSetup.startupSequence.push(obj);
*/
Oskari.clazz.define("Oskari.coordinatetransformation.instance",
function () {
        var conf = this.getConfiguration();
        conf.name = 'coordinatetransformation';
        conf.flyoutClazz = 'Oskari.coordinatetransformation.Flyout'
        this.plugins = {};
        this._mapmodule = null;
        this.transformationService = null;
        this.views = null;
        this.helper = null;
        this.loc = Oskari.getMsg.bind(null, 'coordinatetransformation');
        this.isMapSelection = false;
        this.sandbox = Oskari.getSandbox();
}, {
    __name: 'coordinatetransformation',
    getName: function () {
            return this.__name;
    },
    getViews: function () {
        return this.views;
    },
    getService: function () {
        return this.transformationService;
    },
    /**
     * @method afterStart
     */
    afterStart: function () {
        var sandbox = this.getSandbox();
        this.transformationService = this.createService(sandbox);
        this._mapmodule = sandbox.findRegisteredModuleInstance('MainMapModule');
        this.helper = Oskari.clazz.create( 'Oskari.coordinatetransformation.helper', this);

        this.instantiateViews();
        this.createUi();
    },
    getPlugins: function() {
        return this.plugins;
    },
    instantiateViews: function () {
        this.views = {
            transformation: Oskari.clazz.create('Oskari.coordinatetransformation.view.transformation', this),
            MapSelection: Oskari.clazz.create('Oskari.coordinatetransformation.view.CoordinateMapSelection', this),
            mapmarkers: Oskari.clazz.create('Oskari.coordinatetransformation.view.mapmarkers', this)
        }
    },
    toggleViews: function (view) {
        var views = this.getViews();
        if( !views[view] ) {
           return;
        }
        Object.keys( views ).forEach( function ( view ) {
            views[view].setVisible(false);
        });
        views[view].setVisible(true);
    },
    createUi: function () {
        this.plugins['Oskari.userinterface.Flyout'].createUi();
    },
    mapSelectionMode: function () {
        return this.isMapSelection;
    },
    setMapSelectionMode: function (isSelect){
        this.isMapSelection = !!isSelect;
        if (isSelect === true){
            this.sandbox.postRequestByName(
                'EnableMapKeyboardMovementRequest'
            );
            this.sandbox.postRequestByName('MapModulePlugin.GetFeatureInfoActivationRequest', [false]);
        } else {
            this.sandbox.postRequestByName(
                'DisableMapKeyboardMovementRequest'
            );
            this.sandbox.postRequestByName('MapModulePlugin.GetFeatureInfoActivationRequest', [true]);
        }
    },
    /**
     * Creates the coordinatetransformation service and registers it to the sandbox.
     * @method createService
     * @param  {Oskari.Sandbox} sandbox
     * @return {Oskari.coordinatetransformation.TransformationService}
     */
    createService: function(sandbox) {
        var TransformationService = Oskari.clazz.create( 'Oskari.coordinatetransformation.TransformationService', this );
        sandbox.registerService(TransformationService);
        return TransformationService;
    }
}, {
        /**
         * @property {String[]} protocol
         * @static
         */
        extend : ["Oskari.userinterface.extension.DefaultExtension"],
        protocol: ['Oskari.bundle.BundleInstance', 'Oskari.mapframework.module.Module']
});
