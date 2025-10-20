// https://github.com/vitejs/vite/issues/1149
// Needed for Vite to be able to correctly export modules using import.meta

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            { useBuiltIns: 'entry', corejs: '2', targets: { node: 'current' } },
        ],
        '@babel/preset-typescript',
    ],
    plugins: [
        function () {
            return {
                visitor: {
                    MetaProperty(path) {
                        path.replaceWithSourceString('process')
                    },
                },
            }
        },
    ],
}