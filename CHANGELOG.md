# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning].
This change log follows the format documented in [Keep a CHANGELOG].

[semantic versioning]: http://semver.org/
[keep a changelog]: http://keepachangelog.com/

## 2.1.0 - 2021-04-30

### Changed

- Moved `react` and `preact` from peer to regular dependencies.

## 2.0.0 - 2021-02-22

### Changed

- **BREAKING**: Stopped triggering `beforeunload` when redirecting, unless `unloading: true` is present in the `landing` argument.

## Added

- Added `unloading` property (defaults to `true`) to the `landing` argument.

- Added ability to pass `landing` argument to `redirect` function.

## 1.3.2 - 2021-02-22

### Fixed

- Applied changes made in v1.2.1 but accidentally canceled by v1.3.0.

## 1.3.1 - 2021-02-12

### Fixed

- Made it work in the Node.js environment.

## 1.3.0 - 2021-02-12

### Added

- Added support for `beforeunload` event when performing navigation.

## 1.2.1 - 2021-01-06

### Fixed

- Fixed `hash` being `undefined`.

## 1.2.0 - 2021-01-06

### Added

- Added `landing` property to the location type that contains information on how the app gets landed at the location, such as `redirected`.

- Added `redirect` function to the router that automatically sets `redirected: true` to the `landing` argument.

## 1.1.3 - 2020-10-21

### Fixed

- Made hash always present in the location

## 1.1.2 - 2020-06-04

### Fixed

- Fixed `route`'s path argument type definition

## 1.1.0 - 2020-05-18

### Added

- Made `route` accept string
- Made `Path` generic in `route` more specific, so it would warn if you the path is of a wrong type

## 1.0.0 - 2020-05-03

Initial release
