const observableModule = require("tns-core-modules/data/observable");

exports.onLoaded = function(args)
{
    const page = args.object;

    page.bindingContext = observableModule.fromObject(
    {
        examples: [
            {title: "NSChart", moduleName: "examples/NSChart"},
            {title: "NSUIChart", moduleName: null}
        ]
    });
};

exports.goToExample = function(args)
{
    const page = args.object.page;

    console.log('goToExample');
    page.frame.navigate(page.bindingContext.examples[args.index].moduleName);
};