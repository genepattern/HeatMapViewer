var HeatMapViewer = function()
{
    function load(datasetUrl)
    {
        var heatMap = new gpVisual.HeatMap(datasetUrl, $("#heatmap"));
        var MAX_ZOOM = 80;
        var ZOOM_STEP = 4;

        var parser = $('<a/>');
        parser.attr("href", datasetUrl);
        var datasetFileName = parser[0].pathname.substring(parser[0].pathname.lastIndexOf('/')+1);

        $("#fileLoaded").empty();
        $("#fileLoaded").append("<span>Loaded: <a href='" + datasetUrl + "'>" + datasetFileName + "</a></span>");

        $("#options").button().click(function (event)
        {
            event.preventDefault();

            var optionsDialog = $("<div/>").addClass("optionsDialog");
            optionsDialog.append($("<div/>")
                .append($("<label>Color Scheme: </label>")
                    .append($("<input type='radio' id='relativeScheme' name='cScheme' value='relative'>" +
                        "<label for='relativeScheme'>Relative</label>"))
                    .append($("<input type='radio' id='globalScheme' name='cScheme' value='global'>" +
                        "<label for='relativeScheme'>Global</label>")))
                .append($("<table/>")
                        .append($("<tr>")
                            .append("<td>Minimum Color: </td>")
                            .append('<td><input type="text" title="Minimum' +'" class="colorPicker" data-control="hue" value="0000FF"/></td>'))
                        .append($("<tr>")
                            .append("<td>Midway Color:</td>")
                            .append('<td><input type="text" title="Midway' +'" class="colorPicker" data-control="hue" value="#FFFFFF"/> </td>'))
                        .append($("<tr>")
                            .append("<td>Maximum Color:</td>")
                            .append('<input type="text" title="Maximum' +'" class="colorPicker" data-control="hue" value="#FF0000"/>'))));

            optionsDialog.dialog(
            {
                title: "Options",
                minWidth: 440,
                minHeight: 410,
                modal: true,
                create: function ()
                {
                    if(heatMap.colorScheme == heatMap.COLOR_SCHEME.GLOBAL)
                    {
                        optionsDialog.find("input[name='cScheme'][value='global']").prop('checked', 'checked');
                    }
                    else
                    {
                        optionsDialog.find("input[name='cScheme'][value='relative']").prop('checked', 'checked');
                    }

                    $(".colorPicker").minicolors({
                        control: $(this).attr('data-control') || 'hue',
                        defaultValue: $(this).attr('data-defaultValue') || '',
                        inline: $(this).attr('data-inline') === 'true',
                        letterCase: $(this).attr('data-letterCase') || 'lowercase',
                        opacity: $(this).attr('data-opacity'),
                        position: $(this).attr('data-position') || 'bottom left',
                        theme: 'default'
                    });
                },
                buttons:
                {
                    OK: function ()
                    {

                        $(".colorPicker").each(function()
                        {
                            var hexColor = $(this).minicolors('value');
                            var title = $(this).attr('title');
                            var rgbColorObj = $(this).minicolors("rgbObject");
                            var rgbColor = [];
                            rgbColor.push(rgbColorObj.r);
                            rgbColor.push(rgbColorObj.g);
                            rgbColor.push(rgbColorObj.b);

                            var colors = heatMap.getColors();

                            if(hexColor !== undefined && hexColor !== null && hexColor.length > 0)
                            {
                                if(title == "Minimum")
                                {
                                    if(colors == undefined || colors == null || colors.length < 1)
                                    {
                                        colors.push("");
                                    }
                                    colors[0] = rgbColor;
                                }
                                if(title == "Midway")
                                {
                                    if(colors == undefined || colors == null || colors.length < 2)
                                    {
                                        colors.push("");
                                    }
                                    colors[1] = rgbColor;
                                }
                                if(title == "Maximum")
                                {
                                    if(colors == undefined || colors == null || colors.length < 3)
                                    {
                                        colors.push("");
                                    }
                                    colors[2] = rgbColor;
                                }

                                heatMap.setColors(colors);
                            }
                        });

                        var colorScheme = $("input[name='cScheme']:checked").val();

                        if(colorScheme == "global")
                        {
                            heatMap.updateColorScheme(heatMap.COLOR_SCHEME.GLOBAL, false, null);
                        }
                        else
                        {
                            heatMap.updateColorScheme(heatMap.COLOR_SCHEME.RELATIVE, false, null);
                        }

                        $(this).dialog("destroy");
                    },
                    Cancel: function ()
                    {
                        $(this).dialog("destroy");
                    }
                }
            });

        });

        $("#zoomIn").button().click(function (event)
        {
            var newZoomLevel = heatMap.getZoomLevel() + ZOOM_STEP;

            if(newZoomLevel <= MAX_ZOOM)
            {
                heatMap.zoom(newZoomLevel);

                $("#zoomOut").prop('disabled', false);
            }

            //disable zooming in if limit has been reached
            var nextZoomLevel = heatMap.getZoomLevel() + ZOOM_STEP;
            if(nextZoomLevel > MAX_ZOOM)
            {
                $(this).prop('disabled', true);
            }
        });

        $("#zoomOut").button().click(function (event)
        {
            var newZoomLevel = heatMap.getZoomLevel() - ZOOM_STEP;

            if(newZoomLevel > 0 && (newZoomLevel <= MAX_ZOOM))
            {
                heatMap.zoom(newZoomLevel);

                $("#zoomIn").prop('disabled', false);

            }

            //disable zooming out if limit has been reached
            var nextZoomLevel = heatMap.getZoomLevel() - ZOOM_STEP;
            if(nextZoomLevel <= 0 && (nextZoomLevel > MAX_ZOOM))
            {
                $(this).prop('disabled', true);
            }
        });

        $("#saveImage").button().click(function (event) {
            event.preventDefault();

            var saveImageDialog = $("<div/>").addClass("saveImageDialog");
            saveImageDialog.append($("<div/>")
                .append($("<label>File name: </label>")
                    .append("<br/>")
                    .append($("<input type='text'/>").addClass("imageFileName"))));

            saveImageDialog.append($("<div/>")
                .append($("<label>File format: </label>")
                    .append("<br/>")
                    .append($("<select/>").addClass("imageFileFormat")
                        .append("<option value='svg'>svg</option>")
                        .append("<option value='png'>png</option>").val("svg"))));

            saveImageDialog.dialog(
            {
                title: "Save Image",
                minWidth: 420,
                minHeight: 275,
                modal: true,
                create: function () {
                    //convert to a jQuery UI select menu
                    $(this).find(".imageFileFormat").selectmenu();
                },
                buttons: {
                    OK: function () {

                        heatMap.saveImage();
                        $(this).dialog("destroy");
                    },
                    Cancel: function () {
                        $(this).dialog("destroy");
                    }
                }
            });
        });

        heatMap.drawHeatMap();
    }

    // declare 'public' functions
    return {
        load:load
    };
}();

var gpVisual = {};

gpVisual.HeatMap = function(dataUrl, container) {
    var datasetUrl = dataUrl;
    var hContainer = container;
    var gpHeatmap = null;
    var colors = null;
    var colorScheme = null;
    this.COLOR_SCHEME = {
       RELATIVE : 0,
       GLOBAL : 1
    };
    var self = this;

    this.drawHeatMap = function ()
    {
        var bodyWidth = hContainer.width();
        var totalHeight;

        hContainer.empty();
        hContainer.heatmap(
        {
            data: {
                values: new jheatmap.readers.GctHeatmapReader({ url: datasetUrl })
            },
            init: function (heatmap) {
                gpHeatmap = heatmap;

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
    };

    this.setRelativeColorScheme = function(isDiscrete)
    {
        self.colorScheme = this.COLOR_SCHEME.RELATIVE;

        var rColors = [];
        if(!isDiscrete)
        {
            var minColor = [0, 0, 255];
            var midColor = [255, 255, 255];
            var maxColor = [255, 0, 0];

            if (self.colors != undefined && self.colors !== null && self.colors.length > 0)
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
        }
        else
        {

        }

        gpHeatmap.cells.decorators[0] = new jheatmap.decorators.RowLinear(
        {
            colors: rColors
        });
    };

    this.getColorScheme = function()
    {
        return this.colorScheme;
    };

    this.updateColorScheme = function (colorScheme, isDiscrete, colors)
    {
        if(colorScheme == this.COLOR_SCHEME.GLOBAL)
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
        hRes.paint(null, true, true);
    };

    this.saveImage = function ()
    {
        var originalWidth = gpHeatmap.size.width;
        var originalHeight = gpHeatmap.size.height;

        var fullHeight = gpHeatmap.rows.values.length * gpHeatmap.rows.zoom;
        var fullWidth = gpHeatmap.cols.values.length * gpHeatmap.cols.zoom;

        //gpHeatmap.size.height = 12 * ;//30000;
        gpHeatmap.size.height = fullHeight; // / 2;

        var imageFormat = $(".imageFileFormat").val();
        var imageFileName = $(".imageFileName").val();

        if (imageFormat === "png") {
            //limit on size of heatmap if saving as PNG
            if (fullHeight * fullWidth > 43000000) {
                alert("Image is too large to save as png. Please save as SVG instead.");
                throw new Error("Image is too large to save as png. Please save as SVG instead.");
            }

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);

            var className = "html2canvasreset";
            hContainer.addClass(className);
            var visibleControlPanel = $(".topleft").children(":visible");

            visibleControlPanel.hide();
            $("#heatmap-details").children().hide();
            var border = $(".topleft").css("border");
            $(".topleft").css("border", "none");

            html2canvas(hContainer,
            {
                //height: 2000,
                onrendered: function (canvas) {
                    //$("#heatmap").removeClass(className);

                    // canvas is the final rendered <canvas> element
                    //var dataURL = canvas.toDataURL();
                    //window.location = dataURL;
                    var file = imageFileName;
                    canvas.toBlob(function (blob) {
                        saveAs(blob, file);
                    });

                    //this is the scrollbars
                    //$(".borderL").show();
                    //$(".borderT").show();

                    //$(".topleft").children().show();
                    visibleControlPanel.show();
                    $("#heatmap-details").children().show();
                    $(".topleft").css("border", border);
                    self.drawHeatMap();
                }
            });
        }
        else {
            //the default is to save as svg
            //gpHeatmap.size.height = 12 * ;//30000;  // ---> 12 is the default zoom size
            gpHeatmap.size.height = fullHeight; // / 2;
            gpHeatmap.size.width = fullWidth;

            var context = new C2S(gpHeatmap.size.width + 300, gpHeatmap.size.height + 300);

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(context, true, true);

            var svg = context.getSerializedSvg();
            var blob = new Blob([ svg ], {
                type: "text/plain;charset=utf-8"
            });

            var file = imageFileName + ".svg";
            saveAs(blob, file);

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);
        }
    };
};

$(function()
{
    var requestParams = gpUtil.parseQueryString();
    var datasetUrl = requestParams["dataset"];
    HeatMapViewer.load(datasetUrl);
});