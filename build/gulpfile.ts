/**
 * houston/build/gulpfile.ts
 * Builds all of houston. Places everything in houston/dest directory.
 */

import * as fs from 'fs-extra'
import * as gulp from 'gulp'
import * as path from 'path'

import * as sourcemap from 'gulp-sourcemaps'

import * as typescript from 'gulp-typescript'

import * as common from './common'

const tsConfig = path.resolve(common.paths.root, 'tsconfig.production.json')
const tsProject = typescript.createProject(tsConfig)

/**
 * clean
 * Removes the build directory
 *
 * @async
 * @return {string[]} - A list of removed files
 */
gulp.task('clean', () => {
  return fs.remove(common.paths.dest)
})

/**
 * copy
 * Copies over files that do not need to be built, but must be in project folder
 *
 * @return {stream} - A gulp task
 */
gulp.task('copy', () => {
  const src = path.resolve(common.paths.src)
  const dest = path.resolve(common.paths.dest)

  return gulp.src([
    path.resolve(src, '**/*'),
    '!' + path.resolve(src, '**/*.ts')
  ], { base: src })
    .pipe(gulp.dest(dest))
})

/**
 * typescript
 * Builds all typescript files into regular javascript files
 *
 * @return {stream} - A gulp task
 */
gulp.task('typescript', () => {
  const src = path.resolve(common.paths.src)
  const dest = path.resolve(common.paths.dest)

  return gulp.src([
    path.resolve(src, '**', '*.ts'),
    '!' + path.resolve(src, '**', '*.e2e.ts'),
    '!' + path.resolve(src, '**', '*.spec.ts')
  ], { base: src })
    .pipe(sourcemap.init())
    .pipe(tsProject())
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest(dest))
})

/**
 * build
 * Builds all houston assets
 *
 * @return {stream} - A gulp task
 */
gulp.task('build', gulp.series('clean', gulp.parallel('copy', 'typescript')))

/**
 * watch
 * Builds all the houston assets, but watches for changes for faster building
 *
 * @return {void}
 */
gulp.task('watch', () => {
  const src = path.resolve(common.paths.src, '**', '*.ts')

  return gulp.watch(src, gulp.series('typescript'))
})
