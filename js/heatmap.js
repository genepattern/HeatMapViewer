var HeatMapViewer = function()
{
    function showErrorMessage(msg, title)
    {
        var errorDialog = $( "<div/>" ).addClass("errorDialog").dialog(
        {
            title: title,
            minHeight: 240,
            create: function ()
            {
                $(this).append("<div><p>" + msg +"</p></div>");
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

    function _retrieveFinalGSUrl(fileUrl, options)
    {

        fileUrl += "?endpointurl=true";
        $.ajax({
            contentType: null,
            url: fileUrl,
            xhrFields: {
                withCredentials: true
            },
            dataType: "json",
            crossDomain: true
        }).done(function (response, status, xhr) {
            if(options != undefined && $.isFunction(options.successCallBack))
            {
                options.successCallBack(response);
            }
            _loadUrl(response.endpoint);
        }).fail(function (response, status, xhr)
        {
            console.log(response.statusText);
            if(options !== undefined && $.isFunction(options.failCallBack))
            {
                options.failCallBack(response.statusText, response);
            }
        });
    }

    function load(datasetUrl)
    {
        //if the URL is an ftp url then fail
        if(datasetUrl.indexOf("ftp://") === 0)
        {
            var errorMsg = "Error: FTP files are not supported.";
            $("#toolBarHeatmapMain").remove();
            $("body").append("<div><p class='error'>" + errorMsg + "</p></div>");
            return;
        }

        var heatMap = new gpVisual.HeatMap(
        {
            dataUrl: datasetUrl,
            container: $("#heatmap"),
            showLegend: true,
            onLoadData: function(status)
            {
                if(status !== undefined && status.error !== undefined)
                {
                    $("#toolBarHeatmapMain").remove();
                    $("body").append("<p class='error'>Error: " + status.error + "</p>");
                }
            }
        });

        var MAX_ZOOM = 80;
        var ZOOM_STEP = 4;

        var parser = $('<a/>');
        parser.attr("href", datasetUrl);
        var datasetFileName = parser[0].pathname.substring(parser[0].pathname.lastIndexOf('/')+1);

        $("#fileLoaded").empty();
        $("#fileLoaded").append("<span>Loaded: <a href='" + datasetUrl + "'>" + decodeURIComponent(datasetFileName) + "</a></span>");

        $("#options").button().click(function (event)
        {
            event.preventDefault();

            var optionsDialog = $("<div/>").addClass("optionsDialog");
            optionsDialog.append($("<div/>").addClass("space")
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

                            var hColors = heatMap.getColors();

                            var index = 0;
                            while(hColors != undefined && index < hColors.length)
                            {
                                var hexColor = (new jheatmap.utils.RGBColor(hColors[index])).toHex();

                                $($(".gradientColor").get(index)).spectrum("set", hexColor);
                                index++;
                            }
                        }))
                    .append("<label for='gradientColors'>Use Gradient Colors</label>")
                    .append($("<input type='radio' id='discreteColors' name='discreteGradient' value='discrete'>")
                        .click(function()
                        {
                            $("#discreteColorsDiv").show();
                            $("#gradientColorTable").hide();

                            $("#discreteColorsList").empty();

                            //Set the discrete colors
                            var hColors = heatMap.getColors();

                            var index = 0;
                            while(hColors != undefined && index < hColors.length)
                            {
                                var hexColor = (new jheatmap.utils.RGBColor(hColors[index])).toHex();

                                $("#addColor").click();
                                $($(".discreteColor").get(index)).spectrum("set", hexColor);
                                index++;
                            }
                        }))
                    .append("<label for='discreteColors'>Use Discrete Colors</label>")))
                .append($("<table/>").attr("id", "gradientColorTable").hide()
                    .append($("<tr>")
                        .append("<td>Minimum Color: </td>")
                        .append('<td><input id="minColor" type="text" class="gradientColor" title="Minimum' +'"value="#0000FF"/></td>'))
                    .append($("<tr>")
                        .append("<td>Midway Color:</td>")
                        .append('<td><input id="midColor" type="text" class="gradientColor" title="Midway' +'" value="#FFFFFF"/> </td>'))
                    .append($("<tr>")
                        .append("<td>Maximum Color:</td>")
                        .append('<td><input id="maxColor" type="text" class="gradientColor" title="Maximum' +'" value="#FF0000"/></td>')))
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

                            var colorInput = $('<input type="text" class="discreteColor" value="#000000"/>');
                            $("<li/>").append(colorInput).append(delButton).appendTo("#discreteColorsList");
                            colorInput.spectrum();
                        })));

            $("#discreteColorsList").sortable();

            optionsDialog.dialog(
            {
                title: "Options",
                minWidth: 480,
                minHeight: 400,
                modal: true,
                create: function ()
                {
                    $(".gradientColor").spectrum();
                    if(heatMap.colorScheme == heatMap.COLOR_SCHEME.GLOBAL)
                    {
                        optionsDialog.find("input[name='cScheme'][value='global']").prop('checked', 'checked');
                    }
                    else
                    {
                        optionsDialog.find("input[name='cScheme'][value='relative']").prop('checked', 'checked');
                    }

                    if(heatMap.isDiscrete)
                    {
                        optionsDialog.find("input[name='discreteGradient'][value='discrete']").click();
                        optionsDialog.find("input[name='discreteGradient'][value='discrete']").prop('checked', 'checked');
                    }
                    else
                    {
                        optionsDialog.find("input[name='discreteGradient'][value='gradient']").click();
                        optionsDialog.find("input[name='discreteGradient'][value='gradient']").prop('checked', 'checked');
                    }
                },
                buttons:
                {
                    OK: function ()
                    {
                        var heatMapColors = heatMap.getColors();

                        /*function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
                        function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
                        function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
                        function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}*/

                        var isDiscrete = $("input[name='discreteGradient']:checked").val() == "discrete";

                        heatMap.isDiscrete = isDiscrete;

                        if(!heatMap.isDiscrete)
                        {
                            $(".gradientColor").each(function()
                            {
                                var rgbColorObj = $(this).spectrum("get").toRgb() ;
                                var R = Math.round(rgbColorObj.r); //hexToR(hexColor);
                                var G = Math.round(rgbColorObj.g); //hexToG(hexColor);
                                var B = Math.round(rgbColorObj.b); // hexToB(hexColor);

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
                        }
                        else
                        {
                            var discreteHeatmapColors = [];
                            $(".discreteColor").each(function()
                            {
                                var rgbColorObj = $(this).spectrum("get").toRgb() ;
                                var R = Math.round(rgbColorObj.r); //hexToR(hexColor);
                                var G = Math.round(rgbColorObj.g); //hexToG(hexColor);
                                var B = Math.round(rgbColorObj.b); // hexToB(hexColor);

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

        $("#reload").button().click(function(event)
        {
            /*heatMap = new gpVisual.HeatMap(datasetUrl, $("#heatmap"));
            heatMap.init({
                showLegend: true
            });*/
            heatMap.drawHeatMap({
                reloadData: true
            });
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

                    //var loadingImage = $('<div id="loadingImage"><img src="css/images/loading.gif"/></div>');

                    //var loadingImage = $('<div id="progressbar"></div>');

                    //$('.saveImageDialog').prepend(loadingImage);

                    //$("#loadingImage").hide();
                },
                buttons: {
                    OK: function () {
                        var imageFileName = $(".imageFileName").val();
                        var imageFormat = $(".imageFileFormat").val();

                        //$("#loadingImage").show();

                        /*$( "#progressbar" ).progressbar({
                            value: false
                        });*/

                        var success = heatMap.saveImage(imageFileName, imageFormat);
                        // $("#loadingImage").remove();

                        if(success)
                        {
                            $(this).dialog("destroy");
                        }
                    },
                    Cancel: function () {
                        $(this).dialog("destroy");
                    }
                }
            });
        });

        $("#help").button().click(function()
        {
            window.open("http://www.broadinstitute.org/cancer/software/genepattern/modules/docs/HeatMapViewer/14");
        });

        $("#addLabels").parent().append("<input id='labelFile' type='file'/>");
        $("#labelFile").change(function()
        {
            var fileName = $('#labelFile').get(0).files[0].name;
            $("#newLabelFileName").empty();
            $("#newLabelFileName").append("<span>" + fileName + "</span>");
        });

        $("#addLabels").button().click(function (event) {
            var labelDialog = $("<div/>").addClass("labelDialog");

            labelDialog.append($("<div/>").attr("id", "labelDialogDiv")
                .append($("<label>Type of label: </label>")
                    .append($("<span/>")
                        .append($("<label>Samples </label>")
                            .prepend("<input type='radio' id='samplesLabel' name='fsLabels' value='samples' checked='checked'>"))
                        .append($("<label>Features</label>")
                            .prepend("<input type='radio' id='featuresLabel' name='fsLabels' value='features'>"))))
                    .append($("<div/>").attr("id", "removeFsLabelsDiv"))
                    .append($("<div/>").attr("id", "addFsLabelsDiv")
                        .append($("<button>Add Label</button>").button().click(function()
                        {
                            $("#labelFile").click();
                        }))
                        .append($("<span/>").attr("id", "addFsLabelsFormat"))
                        .append($("<div/>").attr("id", "newLabelFileName")))
                );

            var showExistingLabels = function(labels) {
                if (labels == undefined) {
                    return;
                }

                $("#removeFsLabelsDiv").empty();

                var removeLabelTable = $("<table/>").attr("id", "labelTable");
                removeLabelTable.append("<tr><th colspan='3'>Current Labels</th></tr>");
                removeLabelTable.append("<tr><td><h4>Label</h4></td><td><h4>Remove</h4></td><td></td></tr>");
                for (var f = 0; f < labels.length; f++) {
                    var removeLabelTr = $("<tr/>");

                    var displayLabel = labels[f];
                    if(displayLabel.length > 170)
                    {
                        displayLabel = displayLabel.substring(0, 150) + "...";
                    }
                    removeLabelTr.append("<td>" + displayLabel + "</td>");

                    var delCheckbox = $("<input type='checkbox'>").click(function () {
                        var removeLabels = $(this).parents(".labelDialog").data("removeLabels");
                        if (removeLabels == undefined) {
                            removeLabels = [];
                        }

                        var currentLabel = $(this).data("label");

                        var matchIndex = $.inArray(currentLabel, removeLabels);
                        if(matchIndex != -1)
                        {
                            removeLabels.splice(matchIndex, 1);
                        }

                        if($(this).is(":checked"))
                        {
                            removeLabels.push(currentLabel);
                        }

                        $(this).parents(".labelDialog").data("removeLabels", removeLabels);
                    });

                    delCheckbox.data("label", labels[f]);
                    $("<td/>").append(delCheckbox).appendTo(removeLabelTr);

                    var editColors = $("<button>edit</button>").attr("id", "editLabelColors");
                    editColors.data("label", labels[f]);
                    editColors.button().click(function () {
                        var label = $(this).data("label");

                        var labelType = $("input[name='fsLabels']:checked").val();

                        var labelDetails;
                        if (labelType === "features")
                        {
                            labelDetails = heatMap.getFeatureLabelDetails(label);
                        }
                        else
                        {
                            labelDetails = heatMap.getSampleLabelDetails(label);
                        }

                        var labelDetailsSize = labelDetails != undefined ? Object.keys(labelDetails).length: 0;

                        if (labelDetailsSize == 0)
                        {
                            console.log("Error: no labels to edit");
                            showErrorMessage("Error: no labels to edit", "Edit Labels Error");
                            return;
                        }

                        var labelDetailsDialog = $("<div/>").addClass("labelDialog");

                        labelDetailsDialog.append($("<table/>").attr("id", "labelDetailsTable"));

                        labelDetailsDialog.dialog(
                        {
                            title: "Edit Label",
                            minWidth: 290,
                            minHeight: 240,
                            maxHeight: 340,
                            modal: true,
                            create: function()
                            {
                                $(this).prepend("<div>Editing: " + label + "</div>");
                                for (var labelInfoKey in labelDetails) {
                                    if (labelDetails.hasOwnProperty(labelInfoKey)) {
                                        var color = labelDetails[labelInfoKey];

                                        var tr = $("<tr/>");
                                        $("#labelDetailsTable").append(tr);

                                        $("<td/>").append(labelInfoKey).appendTo(tr);

                                        var colorInput = $('<input type="text" class="labelDetailsColor" value="#000000"/>');
                                        $("<td/>").append(colorInput).appendTo(tr);
                                        colorInput.spectrum();
                                        colorInput.spectrum("set", color);
                                        colorInput.data("labelItemName", labelInfoKey);
                                    }
                                }
                            },
                            buttons: {
                                OK: function ()
                                {
                                    var newLabelColors = {};
                                    $(".labelDetailsColor").each(function()
                                    {
                                        var labelItemName = $(this).data('labelItemName');
                                        if(labelItemName !== undefined)
                                        {
                                            newLabelColors[labelItemName]= $(this).spectrum("get").toHexString();
                                        }
                                    });

                                    if(labelType == "features")
                                    {
                                        heatMap.updateFeatureLabel(label, newLabelColors);

                                    }
                                    else
                                    {
                                        heatMap.updateSampleLabel(label, newLabelColors);
                                    }

                                    $(this).dialog("destroy");
                                },
                                Cancel: function()
                                {
                                    $(this).dialog("destroy");
                                }
                            }
                        });
                    });

                    $("<td/>").append(editColors).appendTo(removeLabelTr);
                    removeLabelTable.append(removeLabelTr);
                }
                if (labels.length > 0) {
                    $("#removeFsLabelsDiv").append(removeLabelTable);
                    $("#removeFsLabelsDiv").show();
                }
                else {
                    $("#removeFsLabelsDiv").hide();
                }
            };

            labelDialog.find("#featuresLabel").click(function () {
                //Ignore the Name and Description Labels
                showExistingLabels(heatMap.getFeatureLabels());

                //add file format info
                $("#addFsLabelsFormat").empty();
                $("#addFsLabelsFormat").append("<a href='http://www.broadinstitute.org/cancer/software/genepattern/file-formats-guide#GMX' target='_blank'>GMX format</a>");
            });

            labelDialog.find("#samplesLabel").click(function () {
                showExistingLabels(heatMap.getSampleLabels());
                $("#addFsLabelsFormat").empty();
                $("#addFsLabelsFormat").append("<a href='http://www.broadinstitute.org/cancer/software/genepattern/file-formats-guide#CLS' target='_blank'>CLS format</a>");
            });

            labelDialog.dialog(
            {
                title: "Add/Edit Labels",
                minWidth: 450,
                minHeight: 290,
                maxHeight: 350,
                modal: true,
                create: function () {
                    $("#samplesLabel").click();
                },
                buttons: {
                    OK: function ()
                    {
                        var handleError = function(result)
                        {
                            if(result !== undefined && result.error != undefined && result.error.length > 0)
                            {
                                showErrorMessage(result.error);
                            }
                        };

                        if ($('#labelFile').get(0).files.length > 0) {
                            var file = $('#labelFile').get(0).files[0];

                            var fileUrl = URL.createObjectURL(file);

                            var labelType = $("input[name='fsLabels']:checked").val();

                            if (labelType === "features") {
                                heatMap.addFeatureLabels(fileUrl, handleError);
                            }
                            else {

                                heatMap.addSampleLabels(fileUrl, file.name, handleError);
                            }

                            $('#labelFile').val("");
                        }

                        var removeLabels = $(this).data("removeLabels");
                        if (removeLabels !== undefined) {
                            for (var l = 0; l < removeLabels.length; l++) {
                                //If there are existing labels
                                var typeOfLabel = $("input[name='fsLabels']:checked").val();
                                if (typeOfLabel === "features") {
                                    heatMap.removeFeatureLabels(removeLabels[l]);
                                }
                                else {
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
                    "<label for='findSamples'>Samples</label>")))
                .append($("<div/>").attr("id", "caseSensitiveDiv")
                    .append("<label><input type='checkbox' id='findTextCaseSensitive' name='findTextCaseSensitive' " +
                        "checked='checked'>Case-sensitive</label></div>"))
                .append($("<ul/>").attr("id", "hiddenMatchesMain").hide()
                    .append("<li>Hidden Matches</li>")
                    .append($("<ul/>").attr("id", "hiddenMatchesList")))
            );

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
                minWidth: 410,
                minHeight: 250,
                buttons:
                {
                    "Previous": {
                        class: 'previousButton',
                        text: 'Previous',
                        click: function ()
                        {
                            var findText = $("#findText").val();
                            var findType = $("input[name='findType']:checked").val();
                            var startIndex = $(this).data("lastFindIndex");

                            if(startIndex == undefined)
                            {
                                startIndex = 0;
                            }
                            else
                            {
                                startIndex = startIndex - 1;
                            }

                            var caseSensitive = $("#findTextCaseSensitive").is(":checked");

                            var matchResults = {};
                            if(findType == "samples")
                            {
                                matchResults = heatMap.findPreviousSample(findText, startIndex, caseSensitive);
                            }
                            else
                            {
                                matchResults = heatMap.findPreviousFeature(findText, startIndex, caseSensitive);
                            }

                            var lastIndex = matchResults.matchIndex;
                            if(lastIndex == -1)
                            {
                                showErrorMessage("No matches found", "Find Error");
                            }

                            $(this).data("lastFindIndex",lastIndex);
                        }
                    },
                    "Next": {
                        class: 'nextButton',
                        text: 'Next',
                        click: function () {
                            var findText = $("#findText").val();
                            var findType = $("input[name='findType']:checked").val();
                            var startIndex = $(this).data("lastFindIndex");
                            if (startIndex == undefined || startIndex == -1) {
                                startIndex = 0;
                            }
                            else {
                                startIndex = startIndex + 1;
                            }

                            var caseSensitive = $("#findTextCaseSensitive").is(":checked");

                            var matchResults = {};
                            if (findType == "samples") {
                                matchResults = heatMap.findNextSample(findText, startIndex, caseSensitive);
                            }
                            else {
                                matchResults = heatMap.findNextFeature(findText, startIndex, caseSensitive);
                            }

                            var lastIndex = matchResults.matchIndex;
                            if (lastIndex == -1) {
                                showErrorMessage("No matches found", "Find Error");
                            }
                            else
                            {
                                if(matchResults.isHidden)
                                {
                                    $("#hiddenMatchesMain").show();
                                    //add to list of hidden matches
                                    $("#hiddenMatchesList").append("<li>" + matchResults.match + "</li>");
                                }
                            }

                            $(this).data("lastFindIndex", lastIndex);
                        }
                    },
                    "Close": {
                        class: 'closeButton',
                        text: 'Close',
                        click: function () {
                            //Reset the last find index
                            $(this).data("lastFindIndex", -1);
                            $(this).dialog("destroy");
                        }
                    }
                }
            });
        });
    }

    // declare 'public' functions
    return {
        load:load
    };
}();


$(function()
{
    var requestParams = gpUtil.parseQueryString();
    var datasetUrl = requestParams["dataset"];
    if(datasetUrl !== undefined && datasetUrl.length > 0)
    {
        datasetUrl = datasetUrl[0];

        if(datasetUrl == "ftp://ftp.broadinstitute.org/pub/genepattern/datasets/protocols/all_aml_test.preprocessed.gct")
        {
            datasetUrl = "https://www.broadinstitute.org/cancer/software/genepattern/data/protocols/all_aml_test.preprocessed.gct";
        }

        if(datasetUrl == "ftp://ftp.broadinstitute.org/pub/genepattern/datasets/protocols/all_aml_train.gct")
        {
            datasetUrl = "https://www.broadinstitute.org/cancer/software/genepattern/data/protocols/all_aml_train.gct";
        }

        if(datasetUrl == "ftp://ftp.broadinstitute.org/pub/genepattern/datasets/protocols/all_aml_test.gct")
        {
            datasetUrl = "https://www.broadinstitute.org/cancer/software/genepattern/data/protocols/all_aml_test.gct";
        }

        HeatMapViewer.load(datasetUrl);
    }
    else
    {
        $("#toolBarHeatmapMain").remove();
        $("body").append("<div><p class='error'>Error: Could not locate request param 'dataset'.</p></div>");
    }
});