export type Route<RouteName, _RouteParams> = { name: RouteName; path: string }

export type RouteLocation<LocationRoute> = LocationRoute extends Route<
  infer RouteName,
  infer RouteParams
>
  ? {
      name: RouteName
      params: RouteParams
      query: RouteQuery
      hash: string
    }
  : never

export type RouteNotFoundLocation = RouteLocation<Route<'404', undefined>>

export type RouteQuery = {
  [key: string]: string | boolean | number
}

export type RouteParams = {
  [key: string]: string
}

export type RouteRef<LinkRoute> = LinkRoute extends Route<
  infer RouteName,
  infer RouteParams
>
  ? {
      name: RouteName
      query?: RouteQuery
      hash?: string
    } & (RouteParams extends undefined
      ? { params?: undefined }
      : { params: RouteParams })
  : never

export type UnpackRoute<Routes> = Routes extends (infer Route)[] ? Route : never

export const notFoundLocation: RouteNotFoundLocation = {
  name: '404',
  params: undefined,
  query: {},
  hash: ''
}

export function route<RouteName extends string = '', RouteParams = undefined>(
  name: RouteName,
  path: string
): Route<RouteName, RouteParams> {
  return { name, path }
}

export function createRouterCore<AppRoutes extends Array<Route<any, any>>>(
  appRoutes: AppRoutes
) {
  type AppRoute = UnpackRoute<AppRoutes>

  type AppLocation = RouteLocation<AppRoute> | RouteNotFoundLocation

  function resolveLocation(url: string): AppLocation {
    const { pathname, searchParams, hash: unprocessedHash } = new URL(url)
    const query = searchParamsToQuery(searchParams)
    // Remove leading #
    const hash = unprocessedHash.slice(1)

    for (let index = 0; index < appRoutes.length; index++) {
      const route = appRoutes[index]
      const { name, path } = route
      const regExp = pathToRegExp(path)
      const captures = pathname.match(regExp)

      if (captures) {
        const params = parseParams(path, captures.slice(1))
        return {
          name,
          query,
          params,
          hash
        } as AppLocation
      }
    }

    return {
      name: '404',
      params: undefined,
      query,
      hash
    }
  }

  function refToLocation(ref: RouteRef<AppRoute>): AppLocation {
    const { name, params, query, hash } = ref
    return {
      name,
      query,
      params,
      hash
    } as AppLocation
  }

  function buildHref(ref: RouteRef<AppRoute>) {
    const { name } = ref
    const route = appRoutes.find(route => route.name === name)

    if (!route) {
      throw new Error(`Can't find ${name} route`)
    }

    const { params, query, hash } = ref
    const { path } = route

    let href = params
      ? path.replace(/:([^/]+)/g, (_, param) => {
          if (!(param in params)) {
            throw new Error(
              `Can't generate the path for ${name} route: ${param} param is missing in the passed params (${JSON.stringify(
                params
              )})`
            )
          }
          return params[param].toString()
        })
      : path

    const notEmpty = query && Object.keys(query).length > 0
    if (query && notEmpty) {
      const searchParams = new URLSearchParams()
      Object.keys(query).forEach(key => {
        searchParams.set(key, query[key].toString())
      })
      href += `?${searchParams.toString()}`
    }

    if (hash) href += `#${hash}`
    return href
  }

  return { resolveLocation, refToLocation, buildHref }
}

function pathToRegExp(path: string) {
  return new RegExp(`^${path.replace(/(:[^/]+)/g, '([^/]*)')}/?$`)
}

function parseParams(path: string, values: string[]) {
  const segmentNameCaptures = path.match(/:([^/]+)/g)

  if (segmentNameCaptures) {
    const segmentNames = segmentNameCaptures.map(str => str.slice(1))
    const segments: RouteParams = {}
    segmentNames.forEach((name, index) => {
      segments[name] = values[index]
    })
    return segments
  }
}

function searchParamsToQuery(params: URLSearchParams) {
  const query: RouteQuery = {}
  params.forEach((value, key) => {
    query[key] = parseSearchParamValue(value)
  })
  return query
}

function parseSearchParamValue(value: string) {
  if (value === 'true') {
    return true
  } else if (value === 'false') {
    return false
  } else if (parseFloat(value).toString() === value) {
    return parseFloat(value)
  } else {
    return value
  }
}
