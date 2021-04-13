module.exports = {
    // mode: 'modules',
    out: 'docs',
    exclude: ['**/node_modules/**', '**/*.spec.ts', '*typings*'],
    name: 'Nativescript UI Chart Components',
    // excludePrivate: true,
    // ignoreCompilerErrors: true,
    // excludeNotExported: true,
    // includeDeclarations: true,
    excludeProtected: true,
    excludePrivate: true,
    excludeExternals: true,
    tsconfig: 'tsconfig.doc.json',
    readme: 'README.md'
};
