<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2025-12-20

### Added

- chore: tsdown configuration file

### Fixed

- fix: main/module/type entriess in package.json; add exports field

## [1.0.0-rc.0] - 2025-12-20

### Added

- Optional ingredient parsing via [parse-ingredient](https://github.com/jakeboone02/parse-ingredient)
- `parse()` and `safeParse()` methods for Zod schema validated recipe extraction

### Changed

- **BREAKING**: Renamed `toObject()` method to `toRecipeObject()` for clarity
- **BREAKING**: Ingredients and instructions now require grouped structures (each group has `name` and `items`) instead of flat arrays

---

## Pre-Release History

Prior to version 1.0.0-rc.0, this project was in alpha development. No formal changelog was maintained during the alpha phase.

[1.0.0-rc.0]: https://github.com/nerdstep/recipe-scrapers-js/releases/tag/v1.0.0-rc.0
