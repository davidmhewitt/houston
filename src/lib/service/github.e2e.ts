/**
 * houston/src/lib/service/github.e2e.ts
 * Tests the GitHub class.
 */

import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as Log from '../log'
import { GitHub } from './github'
import * as type from './type'

import { tmp } from '../../../test/utility/fs'
import { record } from '../../../test/utility/http'

let testingDir: string

beforeAll(async () => {
  // I'm so sorry to whom is reading this next. My best guess is a race
  // Condition in fs-extra, uuid, or jest. This whole file will just hang
  // Forever without it. I'm so sorry.
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      testingDir = await tmp('lib/service/github')

      // Redirect tmp folder for testing because testing
      GitHub.tmpFolder = testingDir

      return resolve()
    }, 100)
  })
})

afterAll(async() => {
  await fs.remove(testingDir)
})

test('can clone a repository', async () => {
  const repo = new GitHub('https://github.com/elementary/houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder)

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can clone a repository with tag', async () => {
  const repo = new GitHub('https://github.com/elementary/houston')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/0.2.0')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()

  // tslint:disable-next-line non-literal-require
  const pkg = require(path.resolve(folder, 'package.json'))
  expect(pkg).toHaveProperty('version')
  expect(pkg.version).toEqual('0.1.8')
}, 600000) // 10 minutes because of git clone

test.skip('can clone a repository with a non-annotated tag (#511)', async () => {
  const repo = new GitHub('https://github.com/fluks-eos/gdice')

  const folder = path.resolve(testingDir, uuid())
  await fs.mkdirs(folder)

  await repo.clone(folder, 'refs/tags/v1.0.1')

  const stat = await fs.stat(folder)
  expect(stat.isDirectory()).toBeTruthy()
}, 600000) // 10 minutes because of git clone

test('can list all references for a repository', async () => {
  const repo = new GitHub('https://github.com/elementary/houston')

  const references = await repo.references()

  expect(references).toContain('refs/heads/master')
  expect(references).toContain('refs/remotes/origin/v2') // TODO: Future me: remove this
}, 600000) // 10 minutes because of git clone for references

test('can post assets to reference', async () => {
  const { done } = await record('lib/service/github/asset.json')
  const repo = new GitHub('https://github.com/btkostner/vocal')
  const pkg = {
    architecture: 'amd64',
    description: 'Vocal 3.2.6 Loki (amd64)',
    distribution: 'xenial',
    name: 'package.deb',
    path: path.resolve(__dirname, '../../../test/fixture/lib/service/github/vocal.deb'),
    type: 'deb'
  } as type.IPackage

  const newPkg = await repo.uploadPackage(pkg, 'review', '3.2.6')

  expect(newPkg.githubId).toBe(6174740)

  await done()
})

test('can post an log', async () => {
  const { done } = await record('lib/service/github/log.json')
  const repo = new GitHub('https://github.com/btkostner/vocal')
  const log = {
    body: 'testy test test',
    level: Log.Level.ERROR,
    title: 'test'
  } as type.ILog

  const newLog = await repo.uploadLog(log, 'review', '3.2.6')

  expect(newLog.githubId).toBe(326839748)

  await done()
})