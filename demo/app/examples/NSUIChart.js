const observableModule = require("tns-core-modules/data/observable");
const Color = require("@nativescript/core/color").Color;
const fs = require("@nativescript/core/file-system");

function getRandomInt(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor()
{
    var r = getRandomInt(0, 255);
    var g = getRandomInt(0, 255);
    var b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

function loadData()
{
    return JSON.parse(
        fs.knownFolders
            .currentApp()
            .getFile('assets/migration_test.json')
            .readTextSync()
    );
}

exports.onLoaded = function(args)
{
    const page = args.object;
    page.bindingContext = observableModule.fromObject(
    {
        data: new Array(1000).fill(0).map((v, i)=>({
            index:i,
            value: Math.random() * 1
        }))
    });

    console.log('Data', page.bindingContext.data.length, page.bindingContext.data[0]);
};

exports.onNavigationButtonTap = function(args)
{
    args.object.page.frame.goBack();
};