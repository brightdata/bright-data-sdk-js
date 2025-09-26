import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import pkg from './package.json' assert { type: 'json' };

export default {
    input: 'src/index.ts',
    external: [...Object.keys(pkg.dependencies), /^node:/],
    output: [
        {
            dir: 'dist/esm',
            format: 'esm',
            entryFileNames: '[name].mjs',
            preserveModules: true,
        },
        {
            dir: 'dist/cjs',
            format: 'cjs',
            entryFileNames: '[name].cjs',
            preserveModules: true,
        },
    ],
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        replace({
            preventAssignment: true,
            'process.env.BRD_PACKAGE_VERSION': JSON.stringify(pkg.version),
        }),
    ],
};
