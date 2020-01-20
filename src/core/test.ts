import assert from 'assert'
import { createRouterCore, route } from '.'

describe('core', () => {
  describe('route', () => {
    it('allows adding meta data', () => {
      const result = route('home', '/')
      assert.deepEqual(result, {
        name: 'home',
        path: '/'
      })
    })
  })

  describe('createRouterCore', () => {
    const routes = [
      route('home', '/'),
      route<'project', { projectId: string }>('project', '/projects/:projectId')
    ]
    const { resolveLocation, refToLocation, buildHref } = createRouterCore(
      routes
    )

    describe('resolveLocation', () => {
      it('resolves location by URL', () => {
        const location = resolveLocation(
          'http://localhost:3000/projects/qwe?qwe=rty&asd=true&zxc=123#456'
        )
        assert.deepEqual(location, {
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456'
        })
      })
    })

    describe('refToLocation', () => {
      it('generates location from ref', () => {
        const location = refToLocation({
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456'
        })
        assert.deepEqual(location, {
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456'
        })
      })
    })

    describe('buildHref', () => {
      it('generates href from ref', () => {
        const href = buildHref({
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456'
        })
        assert(href === '/projects/qwe?qwe=rty&asd=true&zxc=123#456')
      })
    })
  })
})
