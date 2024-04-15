/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    // mode: 'modules',
    out: 'docs',
    entryPoints: ['src/charting'],
    entryPointStrategy: 'expand',
    exclude: ['**/plugin', '**/references.d.ts', '**/demo', '**/demo_vue', '**/docs', '**/media'],
    name: 'Nativescript UI Chart Components',
    excludeProtected: true,
    excludePrivate: true,
    excludeExternals: true,
    readme: 'README.md'
};
