var datasetUrl = "";
var datasetFileName = "";

$(function()
{
    var requestParams = gpUtil.parseQueryString();

    datasetUrl = requestParams["dataset"];

    var parser = $('<a/>');
    parser.attr("href", datasetUrl);
    datasetFileName = parser[0].pathname.substring(parser[0].pathname.lastIndexOf('/')+1);

    console.log("body width: " + $("body").width());
    console.log("body height: " + $("body").height());

    var bodyWidth = $("body").width();
    $('#heatmap').heatmap(
    {
        data: {
            values: new jheatmap.readers.GctHeatmapReader({ url: datasetUrl })
        },
        init: function (heatmap)
        {
            //heatmap.cols.zoom = 30;
            //heatmap.rows.zoom = 30;
            heatmap.size.width =  bodyWidth - 300; //1100;
            heatmap.size.height = 305; //400; //305;
            //heatmap.cols.labelSize = 330;

            var colorScale = new jheatmap.decorators.Linear({});
            /*var colorScale = new jheatmap.decorators.Heat(
                {
                    minValue: -200,
                    midValue: 0,
                    maxValue: 200,
                    minColor: 0,
                    midColor: 0,
                    maxColor: 0
                });*/
            heatmap.cells.decorators[0] = colorScale;

            /*heatmap.cells.decorators["Values"] = new jheatmap.decorators.Categorical({
                values: ["-2","0","2"],
                colors : ["green","yellow", "yellow"]
            });*/
        }
    });

    $("#fileLoaded").append("<span>Loaded: <a href='" + datasetUrl + "'>" + datasetFileName +"</a></span>");

    $("#saveImage").button().click(function(event)
    {
        event.preventDefault();

        var saveImageDialog = $("<div/>");
        saveImageDialog.append($("<div/>")
            .append($("<label>File name: </label>")
                .append($("<input id='imageFileName' type='text'/>"))));

        saveImageDialog.append($("<div/>")
            .append($("<label>File format: </label>")
            .append($("<select/>")
            .append("<option value='png'>png</option>"))));

        saveImageDialog.dialog(
        {
            buttons: {
                OK: function() {

                    var heatmap = $("#heatmap");
                    html2canvas(heatmap,
                    {
                        height: 1200,
                        onrendered: function(canvas) {
                            // canvas is the final rendered <canvas> element
                            //var dataURL = canvas.toDataURL();
                            //window.location = dataURL;
                            var file = "myheatmapimage";
                            canvas.toBlob(function(blob) {
                                saveAs(blob, file);
                            });
                        }
                    });

                    $( this ).dialog( "close" );
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                }
            }
        }

        );

        //var canvas = document.getElementById("colCanvas");
        //var dataURL = canvas.toDataURL( "image/png" );
        //var dataURL = tempCanvas.toDataURL();

        // set canvasImg image src to dataURL
        // so it can be saved as an image
        //document.getElementById('canvasImg').src = dataURL;
        //window.location = dataURL;
    });
});