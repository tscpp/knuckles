# @knuckles/typescript

## 0.14.0

### Minor Changes

- a62399e: Add types for 'as' binding.

### Patch Changes

- 0c198cc: Fix mapping with "with" hint.
- 7a84ddf: Fix event binding overload types
- ec8381a: Fix mapping for if/ifnot bindings.
- Updated dependencies [0c198cc]
  - @knuckles/fabricator@0.12.1

## 0.13.1

### Patch Changes

- 08bfde9: Various type improvements

## 0.13.0

### Minor Changes

- 207e3e5: Update tsconfig resolution and configuration.

### Patch Changes

- ddc1afc: Fix missing context paramater for some bindings
- d8a396f: Fix first argument of event binding handlers.
- a1c77cb: Wrap negated conditions in if/ifnot bindings with parenthesis
- c998e09: Allow any type in value binding for `select` elements.
- 4d055f2: Handle transpiler errors and report as analyzer issues
- 736fbb0: Use shallow unwrap on $data
- d1fd7ee: Fix cases where some objects were not deconstructed.

## 0.12.0

### Minor Changes

- 81be0c7: Untracked bump
- 38a5a6e: Remember narrowed types in conditions

### Patch Changes

- cd2275e: Ignore deconstruction of all protected and private class members
- c7c9356: Optimize snapshot transpiler
- ecf411f: Add jsdoc to bindings
- 24ee536: Fix default compiler options to match typescript's defaults
- Updated dependencies [81be0c7]
- Updated dependencies [81be0c7]
  - @knuckles/syntax-tree@0.12.0
  - @knuckles/fabricator@0.12.0
  - @knuckles/location@0.12.0

## 0.11.1

### Patch Changes

- ab142eb: Ignore deconstruction of private properties
  - @knuckles/syntax-tree@0.11.1

## 0.11.0

### Minor Changes

- 8009a28:

### Patch Changes

- Updated dependencies [8009a28]
  - @knuckles/fabricator@0.11.0
  - @knuckles/location@0.11.0
  - @knuckles/syntax-tree@0.11.0

## 0.10.4

### Patch Changes

- 243ba74: Improve typings for typescript snapshot

## 0.10.2

### Patch Changes

- 171da85: Fix package exports
