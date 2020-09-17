const observableModule = require("@nativescript/core/data/observable");

exports.onLoaded = function(args)
{
    const page = args.object;

    page.bindingContext = observableModule.fromObject(
    {
        examples: [
            {title: "NS Chart", moduleName: "examples/NSChart"},
            {title: "NS UI Chart", moduleName: "examples/NSUIChart"}
        ]
    });
};

exports.goToExample = function(args)
{
    const page = args.object.page;

    console.log('goToExample');
    page.frame.navigate(page.bindingContext.examples[args.index].moduleName);
};