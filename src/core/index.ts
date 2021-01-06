export type Route<RouteName, RouteParams, RouteMeta> = {
  name: RouteName
  path: ((params: RouteParams) => string) | string
  meta: RouteMeta
}

export type LandingProps = {
  redirected?: boolean
  // TODO: Add more props, also find better names:
  // back?: boolean
  // forward?: boolean
}

export type RouteLocation<
  LocationRoute,
  LocationMeta
> = LocationRoute extends Route<
  infer RouteName,
  infer RouteParams,
  infer _RouteMeta
>
  ? {
      name: RouteName
      params: RouteParams
      query: RouteQuery
      hash: string
      meta: LocationMeta
      landing: LandingProps
    }
  : never

export type RouteNotFoundLocation<NotFoundMeta> = RouteLocation<
  Route<'404', undefined, NotFoundMeta>,
  NotFoundMeta
>

export type RouteQuery = {
  [key: string]: string | boolean | number
}

export type RouteParams = {
  [key: string]: string
}

export type RouteRef<LinkRoute> = LinkRoute extends Route<
  infer RouteName,
  infer RouteParams,
  infer _RouteMeta
>
  ? {
      name: RouteName
      query?: RouteQuery
      hash?: string
    } & (RouteParams extends undefined
      ? { params?: undefined }
      : { params: RouteParams })
  : never

export type InferRoute<Routes> = Routes extends (infer InferredRoute)[]
  ? InferredRoute
  : never

export type InferRouteName<Routes> = Routes extends (infer InferredRoute)[]
  ? InferredRoute extends Route<any, any, any>
    ? InferredRoute['name']
    : never
  : never

export type InferRouteRef<Routes> = RouteRef<InferRoute<Routes>>

export const notFoundLocation: RouteNotFoundLocation<{}> = {
  name: '404',
  params: undefined,
  query: {},
  hash: '',
  meta: {},
  landing: {}
}

export function route<
  RouteName extends string,
  Path extends ((params: any) => string) | string,
  RouteMeta = {}
>(
  name: RouteName,
  path: Path,
  meta?: RouteMeta
): Path extends (() => string) | string
  ? Route<RouteName, undefined, RouteMeta>
  : Path extends (params: infer RouteParams) => string
  ? Route<RouteName, RouteParams, RouteMeta>
  : never {
  // @ts-ignore: I've not idea how to make it happy ¯\_(ツ)_/¯
  return { name, path, meta: meta || {} }
}

export function createRouterCore<AppRoutes extends Array<Route<any, any, any>>>(
  appRoutes: AppRoutes
) {
  type AppRoute = InferRoute<AppRoutes>
  type AppRouteMeta = AppRoute['meta']

  type AppLocation =
    | RouteLocation<AppRoute, AppRouteMeta>
    | RouteNotFoundLocation<AppRouteMeta>

  function resolveLocation(url: string): AppLocation {
    const { pathname, searchParams, hash: unprocessedHash } = new URL(url)
    const query = searchParamsToQuery(searchParams)
    // Remove leading #
    const hash = unprocessedHash.slice(1)

    for (let index = 0; index < appRoutes.length; index++) {
      const route = appRoutes[index]
      const { name, path, meta } = route
      const regExp = pathToRegExp(pathToMatchString(path))
      const captures = pathname.match(regExp)

      if (captures) {
        const params = parseParams(pathToMatchString(path), captures.slice(1))
        return {
          name,
          query,
          params,
          hash,
          meta,
          landing: {}
        } as AppLocation
      }
    }

    return {
      name: '404',
      params: undefined,
      query,
      hash,
      meta: {},
      landing: {}
    } as AppLocation
  }

  function refToLocation(
    ref: RouteRef<AppRoute>,
    landing: LandingProps = {}
  ): AppLocation {
    const { name, params, query, hash } = ref
    const route = appRoutes.find(route => route.name === name)

    if (route) {
      const { meta } = route
      return {
        name,
        query: query || {},
        params,
        hash,
        meta,
        landing
      } as AppLocation
    } else {
      return notFoundLocation
    }
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
      ? pathToMatchString(path).replace(/:([^/]+)/g, (_, param) => {
          if (!(param in params)) {
            throw new Error(
              `Can't generate the path for ${name} route: ${param} param is missing in the passed params (${JSON.stringify(
                params
              )})`
            )
          }
          return params[param].toString()
        })
      : typeof path === 'string'
      ? path
      : path(undefined)

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

const paramsProxy = new Proxy({}, { get: (_, prop) => `:${prop.toString()}` })

function pathToMatchString(path: ((params: any) => string) | string) {
  return typeof path === 'string' ? path : path(paramsProxy)
}
