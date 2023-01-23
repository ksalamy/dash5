/* eslint-disable */
const path = require('path')
const { lstatSync, readdirSync } = require('fs')

// get listing of packages in mono repo
const basePath = path.resolve(__dirname, '../../packages')
const packages = readdirSync(basePath).filter((name) =>
  lstatSync(path.join(basePath, name)).isDirectory()
)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'babel-jest',
    // automatically generated list of our packages from packages directory.
    // will tell jest where to find source code for @mbari/ packages, it points to the src instead of dist.
    ...packages.reduce(
      (acc, name) => ({
        ...acc,
        [`@mbari/${name}(.*)$`]: `<rootDir>/../../packages/./${name}/src/$1`,
      }),
      {}
    ),
  },
  modulePathIgnorePatterns: [
    'node_modules',
    'jest-test-results.json',
    ...packages.reduce(
      (acc, name) => [...acc, `<rootDir>/packages/${name}/dist`],
      []
    ),
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['<rootDir>/jest.stub.js'],
}
