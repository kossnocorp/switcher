import { createRouterCore, route } from '.'

describe('core', () => {
  describe('createRouterCore', () => {
    const routes = [
      route('home', '/'),

      route(
        'project',
        (params: { projectId: string }) => `/projects/${params.projectId}`
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
        expect(location).toEqual({
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456',
          landing: {}
        })
      })

      it('resolves location defined by route with string path', () => {
        const location = resolveLocation('http://localhost:3000/')
        expect(location).toEqual({
          name: 'home',
          params: undefined,
          query: {},
          hash: '',
          landing: {}
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
        expect(location).toEqual({
          name: 'project',
          params: { projectId: 'qwe' },
          query: { qwe: 'rty', asd: true, zxc: 123 },
          hash: '456',
          landing: {}
        })
      })

      it('sets empty query if it is not present in the ref', () => {
        const location = refToLocation({
          name: 'project',
          params: { projectId: 'qwe' },
          hash: '456'
        })
        expect(location).toEqual({
          name: 'project',
          params: { projectId: 'qwe' },
          query: {},
          hash: '456',
          landing: {}
        })
      })

      it('sets empty hash if it is not present in the ref', () => {
        const location = refToLocation({
          name: 'project',
          params: { projectId: 'qwe' }
        })
        expect(location).toEqual({
          name: 'project',
          params: { projectId: 'qwe' },
          query: {},
          hash: '',
          landing: {}
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
        expect(href).toEqual('/projects/qwe?qwe=rty&asd=true&zxc=123#456')
      })
    })
  })
})
