export default {
    branches: ['main'],
    tagFormat: '${version}',
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/npm',
        '@semantic-release/github',
    ],
};
