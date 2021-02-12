# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning].
This change log follows the format documented in [Keep a CHANGELOG].

[semantic versioning]: http://semver.org/
[keep a changelog]: http://keepachangelog.com/

## 1.3.1 - 2021-02-12

### Fixed

- Made it work in the Node.js environment.

## 1.3.0 - 2021-02-12

### Added

- Added support for `beforeunload` event when performing navigation.

## 1.2.1 - 2021-01-06

### Fixed

- Fix `hash` being `undefined`.

## 1.2.0 - 2021-01-06

### Added

- Add `landing` property to the location type contains information on how the app gets landed at the location, such as `redirected.

- Add `redirect` function to the router that automatically sets `redirected: true` to the `landing` property.

## 1.1.2 - 2020-06-04

### Fixed

- Fix `route`'s path argument type definition

## 1.1.0 - 2020-05-18

### Added

- Make `route` accept string
- Make `Path` generic in `route` more specific, so it would warn if you the path is of a wrong type

## 1.0.0 - 2020-05-03

Initial release
