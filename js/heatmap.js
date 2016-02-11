var HeatMapViewer = function()
{
    function showErrorMessage(msg, title)
    {
        var errorDialog = $( "<div/>" ).dialog(
        {
            title: title,
            minHeight: 140,
            create: function ()
            {
                $(this).append("<p>" + msg +"</p>");
            },
            buttons:
            {
                OK: function()
                {
                    $(this).dialog("destroy");
                }
            }
        });
    }

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
                        "<label for='relativeScheme'>Row Relative</label>"))
                    .append($("<input type='radio' id='globalScheme' name='cScheme' value='global'>" +
                        "<label for='globalScheme'>Global</label>")))
                .append($("<div/>").addClass("space")
                    .append($("<input type='radio' id='gradientColors' name='discreteGradient' value='gradient'>")
                        .click(function()
                        {
                            $("#gradientColorTable").show();
                            $("#discreteColorsDiv").hide();
                        }))
                    .append("<label for='gradientColors'>Use Gradient Colors</label>")
                    .append($("<input type='radio' id='discreteColors' name='discreteGradient' value='discrete'>")
                        .click(function()
                        {
                            $("#discreteColorsDiv").show();
                            $("#gradientColorTable").hide();
                        }))
                    .append("<label for='discreteColors'>Use Discrete Colors</label>")))
                .append($("<table/>").attr("id", "gradientColorTable").hide()
                    .append($("<tr>")
                        .append("<td>Minimum Color: </td>")
                        .append('<td><input id="minColor" type="color" class="gradientColor" title="Minimum' +'"value="#0000FF"/></td>'))
                    .append($("<tr>")
                        .append("<td>Midway Color:</td>")
                        .append('<td><input id="midColor" type="color" class="gradientColor" title="Midway' +'" value="#FFFFFF"/> </td>'))
                    .append($("<tr>")
                        .append("<td>Maximum Color:</td>")
                        .append('<td><input id="maxColor" type="color" class="gradientColor" title="Maximum' +'" value="#FF0000"/></td>')))
            .append($("<div/>").attr("id", "discreteColorsDiv").hide()
                    .append($("<ul/>").attr("id", "discreteColorsList"))
                    .append($("<button>Add Color</button>").attr("id", "addColor").button()
                        .click(function()
                        {
                            var delButton = $("<button>x</button>");
                            delButton.button().click(function()
                            {
                                $(this).parent("li").remove();
                            });

                            var colorInput = $('<li><input type="color" class="discreteColor" value="#000000"/></li>').append(delButton);
                            $("#discreteColorsList").append(colorInput);
                        })));

            $("#discreteColorsList").sortable();

            optionsDialog.dialog(
            {
                title: "Options",
                minWidth: 480,
                minHeight: 420,
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

                    var colorSelector = ".gradientColor";
                    var hColors = heatMap.getColors();
                    if(heatMap.isDiscrete)
                    {
                        optionsDialog.find("input[name='discreteGradient'][value='discrete']").click();
                        optionsDialog.find("input[name='discreteGradient'][value='discrete']").prop('checked', 'checked');
                        colorSelector = ".discreteColor";

                        var c = 0;
                        while(hColors != undefined && c < hColors.length)
                        {
                            $("#addColor").click();
                            c++;
                        }
                    }
                    else
                    {
                        optionsDialog.find("input[name='discreteGradient'][value='gradient']").click();
                        optionsDialog.find("input[name='discreteGradient'][value='gradient']").prop('checked', 'checked');
                    }

                    var index = 0;
                    while(hColors != undefined && index < hColors.length)
                    {
                        var hexColor = (new jheatmap.utils.RGBColor(hColors[index])).toHex();

                        $($(colorSelector).get(index)).val(hexColor);
                        index++;
                    }
                },
                buttons:
                {
                    OK: function ()
                    {
                        var heatMapColors = heatMap.getColors();

                        function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
                        function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
                        function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
                        function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}


                        var isDiscrete = $("input[name='discreteGradient']:checked").val() == "discrete";

                        heatMap.isDiscrete = isDiscrete;

                        if(!heatMap.isDiscrete)
                        {
                            $(".gradientColor").each(function()
                            {
                                var hexColor = $(this).val();
                                var R = hexToR(hexColor);
                                var G = hexToG(hexColor);
                                var B = hexToB(hexColor);

                                var rgbColor = [R, G, B];

                                var title = $(this).attr('title');
                                if (title == "Minimum") {
                                    if (heatMapColors == undefined || heatMapColors == null || heatMapColors.length < 1) {
                                        heatMapColors.push("");
                                    }
                                    heatMapColors[0] = rgbColor;
                                }
                                if (title == "Midway") {
                                    if (heatMapColors == undefined || heatMapColors == null || heatMapColors.length < 2) {
                                        heatMapColors.push("");
                                    }
                                    heatMapColors[1] = rgbColor;
                                }
                                if (title == "Maximum") {
                                    if (heatMapColors == undefined || heatMapColors == null || heatMapColors.length < 3) {
                                        heatMapColors.push("");
                                    }
                                    heatMapColors[2] = rgbColor;
                                }

                                heatMap.setColors(heatMapColors);
                            });

                            /*$(".colorPicker").each(function () {
                                var hexColor = $(this).minicolors('value');
                                var title = $(this).attr('title');
                                var rgbColorObj = $(this).minicolors("rgbObject");
                                var rgbColor = [];
                                rgbColor.push(rgbColorObj.r);
                                rgbColor.push(rgbColorObj.g);
                                rgbColor.push(rgbColorObj.b);

                                var colors = heatMap.getColors();

                                if (hexColor !== undefined && hexColor !== null && hexColor.length > 0) {
                                    if (title == "Minimum") {
                                        if (colors == undefined || colors == null || colors.length < 1) {
                                            colors.push("");
                                        }
                                        colors[0] = rgbColor;
                                    }
                                    if (title == "Midway") {
                                        if (colors == undefined || colors == null || colors.length < 2) {
                                            colors.push("");
                                        }
                                        colors[1] = rgbColor;
                                    }
                                    if (title == "Maximum") {
                                        if (colors == undefined || colors == null || colors.length < 3) {
                                            colors.push("");
                                        }
                                        colors[2] = rgbColor;
                                    }

                                    heatMap.setColors(colors);
                                }
                            });*/
                        }
                        else
                        {
                            var discreteHeatmapColors = [];
                            $(".discreteColor").each(function()
                            {
                                var hexColor = $(this).val();
                                var R = hexToR(hexColor);
                                var G = hexToG(hexColor);
                                var B = hexToB(hexColor);

                                var rgbColor = [R, G, B];

                                discreteHeatmapColors.push(rgbColor);
                            });

                            heatMap.setColors(discreteHeatmapColors);
                        }

                        //Check that a color is set
                        heatMapColors = heatMap.getColors();
                        if(heatMapColors == undefined || heatMapColors.length < 1)
                        {
                            var errorMsg = "Error: no colors specified!";
                            showErrorMessage(errorMsg, "Missing Colors");
                            return;
                        }

                        var colorScheme = $("input[name='cScheme']:checked").val();

                        if(colorScheme == "global")
                        {
                            heatMap.updateColorScheme(heatMap.COLOR_SCHEME.GLOBAL, isDiscrete);
                        }
                        else
                        {
                            heatMap.updateColorScheme(heatMap.COLOR_SCHEME.RELATIVE, isDiscrete);
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

        $("#resetZoom").button().click(function(event)
        {
            var defaultZoomLevel = heatMap.getDefaultZoomLevel();
            heatMap.zoom(defaultZoomLevel);
        });

        $("#zoomIn").button().click(function (event)
        {
            var newZoomLevel = heatMap.getZoomLevel() + ZOOM_STEP;

            if(newZoomLevel <= MAX_ZOOM)
            {
                heatMap.zoom(newZoomLevel);

                $("#zoomOut").button( "option", "disabled", false );
            }

            //disable zooming in if limit has been reached
            var nextZoomLevel = heatMap.getZoomLevel() + ZOOM_STEP;
            if(nextZoomLevel > MAX_ZOOM)
            {
                $(this).button( "option", "disabled", true);
            }
        });

        $("#zoomOut").button().click(function (event)
        {
            var newZoomLevel = heatMap.getZoomLevel() - ZOOM_STEP;

            if(newZoomLevel > 0 && (newZoomLevel <= MAX_ZOOM))
            {
                heatMap.zoom(newZoomLevel);

                $("#zoomIn").button( "option", "disabled", false);
            }

            //disable zooming out if limit has been reached
            var nextZoomLevel = heatMap.getZoomLevel() - ZOOM_STEP;
            if(nextZoomLevel <= 0 && (nextZoomLevel > MAX_ZOOM))
            {
                $(this).button( "option", "disabled", true);
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

        $("#addLabels").button().click(function (event) {
            var labelDialog = $("<div/>").addClass("labelDialog");

            labelDialog.append($("<div/>")
                .append($("<label>Type of label: </label>")
                    .append($("<span/>")
                        .append($("<label>Samples </label>")
                            .prepend("<input type='radio' id='samplesLabel' name='fsLabels' value='samples' checked='checked'>"))
                        .append($("<label>Features</label>")
                            .prepend("<input type='radio' id='featuresLabel' name='fsLabels' value='features'>"))))
                    .append($("<div/>").attr("id", "addFsLabelsDiv")
                        .append("<h4>Add Label</h4>")
                        .append("<input id='labelFile' type='file'>"))
                .append($("<div/>").attr("id", "removeFsLabelsDiv")));

            var showExistingLabels = function(labels)
            {
                if(labels == undefined)
                {
                    return;
                }

                $("#removeFsLabelsDiv").empty();

                var removeLabelTable = $("<table/>");
                for(var f = 0; f < labels.length; f++)
                {
                    var removeLabelTr = $("<tr/>");
                    removeLabelTr.append("<td>" + labels[f] + "</td>");

                    var delCheckbox = $("<input type='checkbox'>").click(function()
                    {
                        var removeLabels = $(this).parents(".labelDialog").data("removeLabels");
                        if(removeLabels == undefined)
                        {
                            removeLabels = [];
                        }

                        var selectedLabel = $(this).data("label");
                        removeLabels.push(selectedLabel);
                        $(this).parents(".labelDialog").data("removeLabels", removeLabels);
                    });

                    delCheckbox.data("label", labels[f]);
                    $("<td/>").append(delCheckbox).appendTo(removeLabelTr);

                    removeLabelTable.append(removeLabelTr);
                }

                if(labels.length > 0)
                {
                    removeLabelTable.prepend("<tr><td>Name</td><td>Remove</td></tr>");

                    $("#removeFsLabelsDiv").prepend("<h4>Remove Label</h4>");
                    $("#removeFsLabelsDiv").append(removeLabelTable);
                    $("#removeFsLabelsDiv").show();
                }
                else
                {
                    $("#removeFsLabelsDiv").hide();
                }
            };

            labelDialog.find("#featuresLabel").click(function()
            {
                //Ignore the Name and Description Labels
                var fLabels = heatMap.getFeatureLabels();
                if(fLabels != undefined && fLabels.length > 1)
                {
                   // fLabels = fLabels.splice(2);
                }
                showExistingLabels(fLabels);
            });

            labelDialog.find("#samplesLabel").click(function()
            {
                showExistingLabels(heatMap.getSampleLabels());
            });

            labelDialog.dialog(
            {
                title: "Add/Remove Label",
                minWidth: 400,
                minHeight: 270,
                modal: true,
                create: function ()
                {
                    $("#samplesLabel").click();
                },
                buttons: {
                    OK: function ()
                    {
                        if($('#labelFile').get(0).files.length > 0)
                        {
                            var file = $('#labelFile').get(0).files[0];

                            var fileUrl = URL.createObjectURL(file);

                            var labelType = $("input[name='fsLabels']:checked").val();

                            if(labelType === "features")
                            {
                                heatMap.addFeatureLabels(fileUrl);
                            }
                            else
                            {
                                heatMap.addSampleLabels(fileUrl,file.name);
                            }
                        }

                        var removeLabels = $(this).data("removeLabels");
                        if(removeLabels !== undefined)
                        {
                            for(var l=0;l<removeLabels.length;l++)
                            {
                                //If there are existing labels
                                var typeOfLabel = $("input[name='fsLabels']:checked").val();
                                if(typeOfLabel === "features")
                                {
                                    heatMap.removeFeatureLabels(removeLabels[l]);
                                }
                                else
                                {
                                    heatMap.removeSampleLabels(removeLabels[l]);
                                }
                            }
                        }

                        $(this).dialog("destroy");
                    },
                    Cancel: function () {
                        $(this).dialog("destroy");
                    }
                }
            });
        });

        $("#find").button().click(function()
        {
            var findDialog = $("<div/>").addClass("findDialog");

            findDialog.append($("<div/>")
                .append("<input type='text' id='findText' name='find'>")
                .append($("<div/>").attr("id", "findTypeDiv")
                    .append($("<input type='radio' id='findFeatures' name='findType' class='findType' value='features' checked='checked'>" +
                    "<label for='findFeatures'>Features</label>"))
                    .append($("<input type='radio' id='findSamples' name='findType' class='findType' value='samples'>" +
                    "<label for='findSamples'>Samples</label>"))));

            $("input[name='findType']").click(function()
            {
                //reset the find index
                $(this).parents(".findDialog").data("lastFindIndex", "-1");
            });

            $("#findText").click(function()
            {
                var lastVal = $(this).data("lastValue");
                var curVal = $(this).val().trim();

                if(lastVal != curVal)
                {
                    //reset the find index
                    $(this).parents(".findDialog").data("lastFindIndex", "-1");
                    $(this).data("lastValue", curVal);
                }
            });

            findDialog.dialog(
            {
                title: "Find",
                minWidth: 350,
                minHeight: 235,
                buttons:
                {
                    "Find Next": function ()
                    {
                        var findText = $("#findText").val();
                        var findType = $("input[name='findType']:checked").val();
                        var startIndex = $(this).data("lastFindIndex");
                        if(startIndex == undefined || startIndex == -1)
                        {
                            startIndex = 0;
                        }
                        else
                        {
                            startIndex = startIndex +1;
                        }

                        var lastIndex = -1;
                        if(findType == "samples")
                        {
                            lastIndex = heatMap.findNextSample(findText, startIndex);
                        }
                        else
                        {
                            lastIndex = heatMap.findNextFeature(findText, startIndex);
                        }

                        if(lastIndex == -1)
                        {
                            showErrorMessage("No matches found", "Find Error");
                        }
                        else
                        {
                            $(this).data("lastFindIndex",lastIndex);
                        }
                    },
                    Close: function ()
                    {
                        //Reset the last find indexret
                        $(this).data("lastFindIndex", -1);
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
    var isDiscrete = false;
    var defaultZoomLevel = null;

    this.COLOR_SCHEME = {
       RELATIVE : 0,
       GLOBAL : 1
    };
    var self = this;

    this.drawHeatMap = function ()
    {
        var bodyWidth = hContainer.width();
        var totalHeight;

        var clsUrl = "http://www.broadinstitute.org/cancer/software/genepattern/data/all_aml/all_aml_train.cls";
        hContainer.empty();
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
        startingIndex = startingIndex == undefined ? 0: startingIndex;

        //default to searching features if type is not specified
        var data = gpHeatmap.rows.values;
        if(type == "sample")
        {
            data =  gpHeatmap.cols.values;
        }

        for(var s = startingIndex;s < data.length;s++)
        {
            if(data[s][0].indexOf(text) != -1)
            {
                if(type == "sample")
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
        if(rowIndex == undefined || rowIndex < 0 || rowIndex >= gpHeatmap.rows.length)
        {
            return;
        }

        if(offSet == undefined || offSet < 0)
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
        if(colIndex == undefined || colIndex < 0 || colIndex >= gpHeatmap.cols.length)
        {
            return;
        }

        if(offSet == undefined || offSet < 0)
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
                if(existingLabel == -1)
                {
                    var labelIndex = $.inArray(label, gpHeatmap.rows.header);

                    if (gpHeatmap.rows.annotations == undefined) {
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

    this.addSampleLabels = function(clsUrl, label)
    {
        //add class labels
        var clsAdded = function()
        {
            var labelIndex = $.inArray(label, gpHeatmap.cols.header);

            if(gpHeatmap.cols.annotations == undefined)
            {
                gpHeatmap.cols.annotations = [];
            }

            gpHeatmap.cols.decorators[labelIndex] = new jheatmap.decorators.CategoricalRandom();
            gpHeatmap.cols.annotations.push(labelIndex);

            var hRes = new jheatmap.HeatmapDrawer(gpHeatmap);
            hRes.build();
            hRes.paint(null, true, true);
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

        var fullHeight = gpHeatmap.rows.values.length * gpHeatmap.rows.zoom + 100;
        var fullWidth = gpHeatmap.cols.values.length * gpHeatmap.cols.zoom;

        //gpHeatmap.size.height = 12 * ;//30000;
        gpHeatmap.size.height = fullHeight;

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

            var context = new C2S(gpHeatmap.size.width + 300, gpHeatmap.size.height + 350);

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