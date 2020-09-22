import { fromObject } from '@nativescript/core';
export function onLoaded (args) {
    const page = args.object;
    console.log('onLoaded');

    page.bindingContext = fromObject({
        examples: [
            { title: 'NS Chart', moduleName: 'examples/NSChart' },
            { title: 'NS UI Chart', moduleName: 'examples/NSUIChart' },
        ],
    });
};

export function goToExample  (args) {
    const page = args.object.page;

    console.log('goToExample');
    page.frame.navigate(page.bindingContext.examples[args.index].moduleName);
};
