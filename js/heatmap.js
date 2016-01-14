var HeatMapViewer = function()
{
    function load(datasetUrl)
    {
        var heatMap = new gpVisual.HeatMap(datasetUrl);
        var MAX_ZOOM = 80;
        var ZOOM_STEP = 4;

        var parser = $('<a/>');
        parser.attr("href", datasetUrl);
        var datasetFileName = parser[0].pathname.substring(parser[0].pathname.lastIndexOf('/')+1);

        $("#fileLoaded").empty();
        $("#fileLoaded").append("<span>Loaded: <a href='" + datasetUrl + "'>" + datasetFileName + "</a></span>");

        $("#zoomIn").button().click(function (event)
        {
            var newZoomLevel = heatMap.getZoomLevel() + ZOOM_STEP;

            if(newZoomLevel <= MAX_ZOOM)
            {
                heatMap.zoom(newZoomLevel);

                $("#zoomOut").prop('disabled', false);
            }

            //disable zooming out if limit has been reached
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

gpVisual.HeatMap = function(dataUrl) {
   var datasetUrl = dataUrl;
   var gpHeatmap = null;

    this.drawHeatMap = function ()
    {
        var bodyWidth = $("body").width();
        var totalHeight;

        $('#heatmap').empty();
        $('#heatmap').heatmap(
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

                //var colorScale = new jheatmap.decorators.Linear({});
                /*var colorScale = new jheatmap.decorators.Heat(
                 {
                 minValue: -200,
                 midValue: 0,
                 maxValue: 200,
                 minColor: 0,
                 midColor: 0,
                 maxColor: 0
                 });*/

                //heatmap.cells.decorators[0] = colorScale;

                /*heatmap.cells.decorators["Values"] = new jheatmap.decorators.Categorical({
                 values: ["-2","0","2"],
                 colors : ["green","yellow", "yellow"]
                 });*/
                totalHeight = 7 * heatmap.rows.zoom;

                var colorScale = new jheatmap.decorators.RowLinear();
                heatmap.cells.decorators[0] = colorScale;
            }
        });
    };

    this.getZoomLevel = function()
    {
        return gpHeatmap.rows.zoom;
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
        /* Working - only saves portion of heatmap
         var heatmap = $("#heatmap");
         //var className = "html2canvasreset";
         //heatmap.addClass(className);
         $(".borderL").hide();
         html2canvas(heatmap,
         {
         //height: 2000,
         onrendered: function(canvas)
         {
         //$("#heatmap").removeClass(className);

         // canvas is the final rendered <canvas> element
         //var dataURL = canvas.toDataURL();
         //window.location = dataURL;
         var file = "myheatmapimage";
         canvas.toBlob(function(blob) {
         saveAs(blob, file);
         });
         }
         }); */

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

            var heatmap = $("#heatmap");
            var className = "html2canvasreset";
            heatmap.addClass(className);
            var visibleControlPanel = $(".topleft").children(":visible");

            visibleControlPanel.hide();
            $("#heatmap-details").children().hide();
            $(".topleft").css("border", "none");

            html2canvas(heatmap,
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
                        this.drawHeatMap();
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

            this.drawHeatMap();
        }
    };
};

$(function()
{
    var requestParams = gpUtil.parseQueryString();
    var datasetUrl = requestParams["dataset"];
    HeatMapViewer.load(datasetUrl);
});