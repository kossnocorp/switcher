import assert from 'assert'
import { createRouterCore, route } from '.'

describe('core', () => {
  describe('route', () => {
    it('allows adding meta data', () => {
      const result = route('home', () => '/')
      assert(result.name === 'home')
      assert(
        typeof result.path === 'function' && result.path(undefined) === '/'
      )
      assert.deepEqual(result.meta, {})
    })
  })

  describe('createRouterCore', () => {
    const routes = [
      route('home', '/'),

      route(
        'project',
        (params: { projectId: string }) => `/projects/${params.projectId}`,
        { auth: true }
      )
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
          hash: '456',
          meta: { auth: true }
        })
      })

      it('resolves location defined by route with string path', () => {
        const location = resolveLocation('http://localhost:3000/')
        assert.deepEqual(location, {
          name: 'home',
          params: undefined,
          query: {},
          hash: '',
          meta: {}
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
          hash: '456',
          meta: { auth: true }
        })
      })

      it('sets empty query if it is not present in the ref', () => {
        const location = refToLocation({
          name: 'project',
          params: { projectId: 'qwe' },
          hash: '456'
        })
        assert.deepEqual(location, {
          name: 'project',
          params: { projectId: 'qwe' },
          query: {},
          hash: '456',
          meta: { auth: true }
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
