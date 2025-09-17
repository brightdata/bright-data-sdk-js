'use strict'; /*jslint node:true*/

const E = module.exports;

E.testEnvironment = 'node';
E.collectCoverageFrom = [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
];
E.coverageDirectory = 'coverage';
E.coverageReporters = ['text', 'lcov', 'html'];
E.testMatch = ['**/tests/**/*.js', '**/*.test.js', '**/*.spec.js'];
E.verbose = true;
