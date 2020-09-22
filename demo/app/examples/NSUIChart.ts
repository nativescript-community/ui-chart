import { Color, fromObject, knownFolders } from '@nativescript/core';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return new Color(255, r, g, b);
}

function loadData() {
    return JSON.parse(knownFolders.currentApp().getFile('assets/migration_test.json').readTextSync());
}

export function onLoaded  (args) {
    const page = args.object;
    page.bindingContext = fromObject({
        data: new Array(1000).fill(0).map((v, i) => ({
            index: i,
            value: Math.random() * 1,
        })),
    });

    console.log('Data', page.bindingContext.data.length, page.bindingContext.data[0]);
};

export function onNavigationButtonTap  (args) {
    args.object.page.frame.goBack();
};
