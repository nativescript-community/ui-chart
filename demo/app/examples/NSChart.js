const Color = require("@nativescript/core/color").Color;
const fs = require("@nativescript/core/file-system");
const imageSourceModule = require("@nativescript/core/image-source");
const bd = require("@nativescript-community/ui-chart/data/BarData");
const bds = require("@nativescript-community/ui-chart/data/BarDataSet");
const ld = require("@nativescript-community/ui-chart/data/LineData");
const lds = require("@nativescript-community/ui-chart/data/LineDataSet");
const pd = require("@nativescript-community/ui-chart/data/PieData");
const pds = require("@nativescript-community/ui-chart/data/PieDataSet");

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

exports.onBarChartLoaded = function(args)
{
    const chart = args.object;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    chart.getAxisRight().setEnabled(false);
    chart.setHighlightPerTapEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(5).fill(0).map(function(v, i)
    {
        return {index: i, value: Math.random() * 1};
    });

    console.log('setData', data.length, data[0]);
    const sets = [];
    const set = new bds.BarDataSet(data, 'value', 'index', 'value');
    set.setDrawIcons(true);
    set.setColor(getRandomColor());
    set.setDrawValues(true);
    sets.push(set);

    // create a data object with the data sets
    const bardata = new bd.BarData(sets);

    // set data
    chart.setData(bardata);
};

exports.onLineChartLoaded = function(args)
{
    const chart = args.object;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setScaleEnabled(true);
    chart.setDragEnabled(true);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(1000).fill(0).map((v, i)=>({
        index:i,
        value: Math.random() * 1
    }));

    console.log('setData', data.length, data[0]);
    const sets = [];
    const set = new lds.LineDataSet(data, 'value', 'index', 'value');
    set.setColor(getRandomColor());
    sets.push(set);

    // create a data object with the data sets
    const linedata = new ld.LineData(sets);

    // set data
    chart.setData(linedata);
};

exports.onPieChartLoaded = function(args)
{
    const chart = args.object;

    chart.drawFameRate = true;
    chart.setLogEnabled(true);
    chart.setHighlightPerTapEnabled(true);
    //chart.setHoleRadius(10);
    //chart.setDrawHoleEnabled(false);
    // chart.setHardwareAccelerationEnabled(true);

    const data = new Array(5).fill(0).map(function(v, i)
    {
        return {label: i + "", value: Math.random() * 100};
    });

    // Generate pie colors
    const colors = [];
    while (colors.length < data.length)
    {
        const c = getRandomColor();
        if (!colors.includes(c))
        {
            colors.push(c);
        }
    }

    console.log('setData', data.length, data[0]);
    const sets = [];
    const set = new pds.PieDataSet(data, 'value', 'value');
    set.setColors(colors);
    set.setDrawValues(true);
    sets.push(set);

    // create a data object with the data sets
    const piedata = new pd.PieData(sets);

    // set data
    chart.setData(piedata);
};

exports.redraw = function(args)
{
    const page = args.object.page;

    const bc = page.getViewById("bar-chart");
    if (bc)
    {
        bc.invalidate();
    }

    const hbc = page.getViewById("horizontal-bar-chart");
    if (hbc)
    {
        hbc.invalidate();
    }

    const lc = page.getViewById("line-chart");
    if (lc)
    {
        lc.invalidate();
    }

    const pc = page.getViewById("pie-chart");
    if (pc)
    {
        pc.invalidate();
    }
};

exports.onNavigationButtonTap = function(args)
{
    args.object.page.frame.goBack();
};