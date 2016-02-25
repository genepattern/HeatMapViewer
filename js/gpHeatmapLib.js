var gpVisual = {};

gpVisual.HeatMap = function(dataUrl, container) {
    var datasetUrl = dataUrl;
    var hContainer = container;
    var gpHeatmap = null;
    var colors = null;
    var colorScheme = null;
    var isDiscrete = false;
    var defaultZoomLevel = null;

    this.COLOR_SCHEME = {
        RELATIVE : 0,
        GLOBAL : 1
    };
    var self = this;

    this.drawHeatMap = function (options)
    {
        var bodyWidth = hContainer.width();
        var totalHeight;

        hContainer.empty();
        $("#gpHeatMap_imageRenderCanvas").remove();
        hContainer.before($("<canvas/>").attr("id", "gpHeatMap_imageRenderCanvas"));
        $("#gpHeatMap_imageRenderCanvas").hide();
        hContainer.heatmap(
            {
                data: {
                    values: new jheatmap.readers.GctHeatmapReader(
                        {
                            url: datasetUrl
                        })
                },
                init: function (heatmap) {
                    gpHeatmap = heatmap;

                    heatmap.controls.shortcuts = false;
                    //heatmap.controls.columnSelector = false;
                    heatmap.controls.cellSelector = false;

                    heatmap.controls.legend = false;

                    if(options !== undefined && options.showLegend !== undefined)
                    {
                        heatmap.controls.legend = options.showLegend;
                    }
                    //height of the columns
                    heatmap.cols.labelSize = 150;

                    //cols and rows zoom level should be the same
                    self.defaultZoomLevel = heatmap.cols.zoom;

                    //heatmap.cols.zoom = 30;
                    //heatmap.rows.zoom = 30;
                    heatmap.size.width = bodyWidth - 300; //1100;
                    heatmap.size.height = 400; //30000; //305;
                    //heatmap.cols.labelSize = 330;

                    /*heatmap.cells.decorators["Values"] = new jheatmap.decorators.Categorical({
                     values: ["-2","0","2"],
                     colors : ["green","yellow", "yellow"]
                     });*/
                    totalHeight = 7 * heatmap.rows.zoom;

                    self.setRelativeColorScheme(false);
                }
            });
    };

    /*
     * Returns the index of the feature with matching text in the heatmap
     */
    this.findNextFeature = function(text, startingIndex)
    {
        return self._findNext(text, startingIndex, "feature");
    };

    /*
     * Returns the index of the feature with matching text in the heatmap
     */
    this.findNextSample = function(text, startingIndex)
    {
        return self._findNext(text, startingIndex, "sample");
    };

    /*
     * Returns the index of the next matching feature or sample in the heatmap
     */
    this._findNext = function(text, startingIndex, type)
    {
        startingIndex = startingIndex === undefined ? 0: startingIndex;

        //default to searching features if type is not specified
        var data = gpHeatmap.rows.values;
        if(type === "sample")
        {
            data =  gpHeatmap.cols.values;
        }

        for(var s = startingIndex;s < data.length;s++)
        {
            if(data[s][0].indexOf(text) != -1)
            {
                if(type === "sample")
                {
                    self._scrollToColumn(s, 10);
                }
                else
                {
                    self._scrollToRow(s, 10);
                }
                return s;
            }
        }

        return -1;
    };

    this._scrollToRow  = function(rowIndex, offSet)
    {
        if(rowIndex === undefined || rowIndex < 0 || rowIndex >= gpHeatmap.rows.length)
        {
            return;
        }

        if(offSet === undefined || offSet < 0)
        {
            offSet = 0;
        }

        gpHeatmap.rows.selected = [rowIndex];

        var scrollRow = (rowIndex - offSet) < 0 ? 0 : (rowIndex - offSet);
        gpHeatmap.offset.top = scrollRow;

        var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
        hRes.build();
        hRes.paint(null, true, true);
    };

    this._scrollToColumn  = function(colIndex, offSet)
    {
        if(colIndex === undefined || colIndex < 0 || colIndex >= gpHeatmap.cols.length)
        {
            return;
        }

        if(offSet === undefined || offSet < 0)
        {
            offSet = 0;
        }

        gpHeatmap.cols.selected = [colIndex];

        var scrollColumn = (colIndex - offSet) < 0 ? 0 : (colIndex - offSet);
        gpHeatmap.offset.left = scrollColumn;

        var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
        hRes.build();
        hRes.paint(null, true, true);
    };

    this.getFeatureLabels = function()
    {
        return  gpHeatmap.rows.header.length > 1 ? gpHeatmap.rows.header.slice(2) : [];
    };

    this.updateFeatureLabel = function(label, rowLabelDetails)
    {
        var rowHeaders = gpHeatmap.rows.header.length > 1 ? gpHeatmap.rows.header : [];

        //find the index of the label
        var index = $.inArray(label, rowHeaders);
        if(index !== -1)
        {
            if(gpHeatmap.rows.decorators !== undefined && index < gpHeatmap.rows.decorators.length)
            {
                var details = gpHeatmap.rows.decorators[index].colors;

                var rowLabelKeys = Object.keys(rowLabelDetails);
                for(var i=0;i<rowLabelKeys.length;i++)
                {
                    details[rowLabelKeys[i]] = rowLabelDetails[rowLabelKeys[i]];
                }

                self.redrawHeatMap();
            }
        }
    };

    this.getFeatureLabelDetails = function(label)
    {
        var rowHeaders = gpHeatmap.rows.header.length > 1 ? gpHeatmap.rows.header : [];

        var details = {};
        //find the index of the label
        var index = $.inArray(label, rowHeaders);
        if(index != -1)
        {
            if(gpHeatmap.rows.decorators !== undefined && index < gpHeatmap.rows.decorators.length)
            {
                details = gpHeatmap.rows.decorators[index].colors;
            }
        }

        return details;
    };


    this.addFeatureLabels = function(featureLabelsUrl)
    {
        var currentFeatureLabels = gpHeatmap.rows.header.slice();

        //add class labels
        var featureLabelsAdded = function()
        {
            for(var l=0;l<gpHeatmap.rows.header.length;l++)
            {
                var label = gpHeatmap.rows.header[l];
                var existingLabel = $.inArray(label, currentFeatureLabels);

                //check if this is a new label
                if(existingLabel === -1)
                {
                    var labelIndex = $.inArray(label, gpHeatmap.rows.header);

                    if (gpHeatmap.rows.annotations === undefined) {
                        gpHeatmap.rows.annotations = [];
                    }

                    gpHeatmap.rows.decorators[labelIndex] = new jheatmap.decorators.CategoricalRandom();
                    gpHeatmap.rows.annotations.push(labelIndex);
                }
            }
            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);
        };

        var addFLabels = new jheatmap.readers.FeatureLabelsReader(
            {
                url: featureLabelsUrl
            });

        addFLabels.read(gpHeatmap.rows, featureLabelsAdded);
    };

    this.removeFeatureLabels = function(label)
    {
        var labelIndex = $.inArray(label, gpHeatmap.rows.header);
        if(labelIndex !== -1)
        {
            gpHeatmap.rows.decorators.splice(labelIndex, 1);
            gpHeatmap.rows.header.splice(labelIndex, 1);

            var annIndex = $.inArray(labelIndex, gpHeatmap.rows.annotations);
            gpHeatmap.rows.annotations.splice(annIndex, 1);

            //remove the values as well
            for(var v=0; v < gpHeatmap.rows.values.length; v++)
            {
                gpHeatmap.rows.values[v].splice(labelIndex, 1);
            }
            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);
        }
    };

    this.getSampleLabels = function()
    {
        return  gpHeatmap.cols.header.length > 1 ? gpHeatmap.cols.header.slice(1) : [];
    };

    this.updateSampleLabel = function(label, sampleLabelDetails)
    {
        var colHeaders = gpHeatmap.cols.header.length > 1 ? gpHeatmap.cols.header : [];

        //find the index of the label
        var index = $.inArray(label, colHeaders);
        if(index != -1)
        {
            if(gpHeatmap.cols.decorators !== undefined && index < gpHeatmap.cols.decorators.length)
            {
                var details = gpHeatmap.cols.decorators[index].colors;

                var sampleLabelKeys = Object.keys(sampleLabelDetails);
                for(var i=0;i<sampleLabelKeys.length;i++)
                {
                    details[sampleLabelKeys[i]] = sampleLabelDetails[sampleLabelKeys[i]];
                }

                self.redrawHeatMap();
            }
        }
    };

    this.getSampleLabelDetails = function(label)
    {
        var colHeaders = gpHeatmap.cols.header.length > 1 ? gpHeatmap.cols.header : [];

        var details = {};
        //find the index of the label
        var index = $.inArray(label, colHeaders);
        if(index != -1)
        {
            if(gpHeatmap.cols.decorators !== undefined && index < gpHeatmap.cols.decorators.length)
            {
                details = gpHeatmap.cols.decorators[index].colors;
            }
        }

        return details;
    };

    this.redrawHeatMap = function(showScrollBars)
    {
        var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
        hRes.build();

        if(showScrollBars === undefined)
        {
            showScrollBars = true;
        }

        hRes.paint(null, showScrollBars);
    };

    this.addSampleLabels = function(clsUrl, label)
    {
        //add class labels
        var clsAdded = function()
        {
            var labelIndex = $.inArray(label, gpHeatmap.cols.header);

            if(gpHeatmap.cols.annotations === undefined)
            {
                gpHeatmap.cols.annotations = [];
            }

            gpHeatmap.cols.decorators[labelIndex] = new jheatmap.decorators.CategoricalRandom();
            gpHeatmap.cols.annotations.push(labelIndex);

            self.redrawHeatMap(true);
        };

        var addCls = new jheatmap.readers.ClsReader(
            {
                url: clsUrl,
                label: label
            });

        addCls.read(gpHeatmap.cols, clsAdded);
    };

    this.removeSampleLabels = function(label)
    {
        var labelIndex = $.inArray(label, gpHeatmap.cols.header);
        if(labelIndex !== -1)
        {
            gpHeatmap.cols.decorators.splice(labelIndex, 1);
            gpHeatmap.cols.header.splice(labelIndex, 1);

            var annIndex = $.inArray(labelIndex, gpHeatmap.cols.annotations);
            gpHeatmap.cols.annotations.splice(annIndex, 1);

            //remove the values as well
            for(var v=0; v < gpHeatmap.cols.values.length; v++)
            {
                gpHeatmap.cols.values[v].splice(labelIndex, 1);
            }
            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);
        }
    };


    this.getDefaultZoomLevel = function()
    {
        return self.defaultZoomLevel;
    };

    this.getZoomLevel = function()
    {
        return gpHeatmap.rows.zoom;
    };

    this.setColors = function(colors)
    {
        self.colors = colors;
    };

    this.getColors = function()
    {
        if(self.colors === undefined || self.colors === null)
        {
            self.colors = [[0, 0, 255], [255,255,255], [255,0,0]];
        }

        return self.colors;
    };

    this.setGlobalColorScheme = function(isDiscrete)
    {
        self.colorScheme = self.COLOR_SCHEME.GLOBAL;
        self.isDiscrete = isDiscrete;


        if(!isDiscrete)
        {
            var minColor = [0, 0, 255];
            var midColor = [255,255,255];
            var maxColor = [255,0,0];

            if(self.colors !== undefined && self.colors !== null && self.colors.length > 0)
            {
                minColor = self.colors[0];
                if(self.colors.length > 1)
                {
                    midColor = self.colors[1];
                }

                if(self.colors.length > 2)
                {
                    maxColor = self.colors[2];
                }
            }

            gpHeatmap.cells.decorators[0] = new jheatmap.decorators.Heat(
                {
                    minValue: gpHeatmap.cells.minValue,
                    midValue: gpHeatmap.cells.meanValue,
                    maxValue: gpHeatmap.cells.maxValue,
                    minColor: minColor,
                    midColor: midColor,
                    maxColor: maxColor
                });
        }
        else
        {
            gpHeatmap.cells.decorators[0] = new jheatmap.decorators.DiscreteColor(
                {
                    colors: self.colors,
                    relative: false,
                    minValue: gpHeatmap.cells.minValue,
                    meanValue: gpHeatmap.cells.meanValue,
                    maxValue: gpHeatmap.cells.maxValue
                });
        }
    };

    this.setRelativeColorScheme = function(isDiscrete)
    {
        self.colorScheme = this.COLOR_SCHEME.RELATIVE;
        self.isDiscrete = isDiscrete;

        if(!isDiscrete)
        {
            var rColors = [];

            var minColor = [0, 0, 255];
            var midColor = [255, 255, 255];
            var maxColor = [255, 0, 0];

            if (self.colors !== undefined && self.colors !== null && self.colors.length > 0)
            {
                minColor = self.colors[0];
                if (self.colors.length > 1) {
                    midColor = self.colors[1];
                }

                if (self.colors.length > 2) {
                    maxColor = self.colors[2];
                }
            }

            var firstColorRange = [];
            firstColorRange.push(minColor, midColor);

            var lastColorRange = [];
            lastColorRange.push(midColor, maxColor);
            rColors = [firstColorRange, lastColorRange];

            gpHeatmap.cells.decorators[0] = new jheatmap.decorators.RowLinear(
                {
                    colors: rColors
                });
        }
        else
        {
            gpHeatmap.cells.decorators[0] = new jheatmap.decorators.DiscreteColor(
                {
                    colors: self.colors,
                    relative: true
                });
        }
    };

    this.getColorScheme = function()
    {
        return this.colorScheme;
    };

    this.updateColorScheme = function (colorScheme, isDiscrete)
    {
        if(colorScheme === this.COLOR_SCHEME.GLOBAL)
        {
            this.setGlobalColorScheme(isDiscrete);
        }
        else
        {
            this.setRelativeColorScheme(isDiscrete);
        }

        var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
        hRes.build();
        hRes.paint(null, true, true);
    };

    this.zoom = function (zoomLevel)
    {
        gpHeatmap.rows.zoom = zoomLevel;
        gpHeatmap.cols.zoom = zoomLevel;


        var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
        hRes.build();
        hRes.paint(null, false);
    };

    this.saveImage = function (fileName, fileFormat)
    {
        var originalWidth = gpHeatmap.size.width;
        var originalHeight = gpHeatmap.size.height;

        var fullHeight = gpHeatmap.rows.values.length * gpHeatmap.rows.zoom + 100;
        var fullWidth = gpHeatmap.cols.values.length * gpHeatmap.cols.zoom;

        //gpHeatmap.size.height = 12 * ;//30000;
        gpHeatmap.size.height = fullHeight;

        if (fileFormat === "png") {
            //limit on size of heatmap if saving as PNG
            if (fullHeight * fullWidth > 43000000) {
                alert("Image is too large to save as png. Please save as SVG instead.");
                //throw new Error("Image is too large to save as png. Please save as SVG instead.");

                gpHeatmap.size.height = originalHeight;
                return false;
            }

            //the default is to save as svg
            //gpHeatmap.size.height = 12 * ;//30000;  // ---> 12 is the default zoom size
            gpHeatmap.size.height = fullHeight; // / 2;
            gpHeatmap.size.width = fullWidth;

            context = new C2S(gpHeatmap.size.width + 300, gpHeatmap.size.height + 350);

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(context, true);

            var svg = context.getSerializedSvg();

            $("#gpHeatMap_imageRenderCanvas").attr("width", gpHeatmap.size.width + 300);
            $("#gpHeatMap_imageRenderCanvas").attr("height", gpHeatmap.size.height + 350);

            canvg(document.getElementById('gpHeatMap_imageRenderCanvas'), svg);

            //redraw the image
            gpHeatmap.size.height = originalHeight;
            gpHeatmap.size.width = originalWidth;
            hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, false);

            var canvas = document.getElementById('gpHeatMap_imageRenderCanvas');
            canvas.toBlob(function (blob) {
                saveAs(blob, fileName);
            });
        }
        else {
            //the default is to save as svg
            //gpHeatmap.size.height = 12 * ;//30000;  // ---> 12 is the default zoom size
            gpHeatmap.size.height = fullHeight; // / 2;
            gpHeatmap.size.width = fullWidth;

            var context = new C2S(gpHeatmap.size.width + 360, gpHeatmap.size.height + 350);

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(context, true);

            var svg = context.getSerializedSvg();
            var blob = new Blob([ svg ], {
                type: "text/plain;charset=utf-8"
            });

            var file = fileName + ".svg";
            saveAs(blob, file);

            gpHeatmap.size.height = originalHeight;
            gpHeatmap.size.width = originalWidth;
            hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, false);
        }

        return true;
    };
};
