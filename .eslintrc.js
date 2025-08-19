'use strict'; /*jslint node:true*/

const E = module.exports;

E.env = {
    node: true,
    es2021: true,
    jest: true
};
E.extends = ['eslint:recommended'];
E.parserOptions = {
    ecmaVersion: 12,
    sourceType: 'script'
};
E.rules = {
    'indent': ['error', 4],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-console': 'off',
    'no-unused-vars': ['error', {'argsIgnorePattern': '^_'}],
    'prefer-const': 'error',
    'no-var': 'error',
    'brace-style': ['error', '1tbs', {'allowSingleLine': true}],
    'space-before-function-paren': ['error', 'never'],
    'object-curly-spacing': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-spacing': ['error', {'before': false, 'after': false}],
    'key-spacing': ['error', {'beforeColon': false, 'afterColon': false}],
    'space-infix-ops': 'off',
    'keyword-spacing': 'off'
};