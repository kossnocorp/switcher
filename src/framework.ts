import {
  cloneElement,
  ComponentChildren,
  createContext,
  createElement,
  ReactElement,
  useContext,
  useEffect,
  useState
} from './adaptor'
import {
  createRouterCore,
  notFoundLocation,
  Route,
  RouteRef,
  InferRoute
} from './core'

export function createRouter<AppRoutes extends Array<Route<any, any, any>>>(
  appRoutes: AppRoutes
) {
  const { resolveLocation, refToLocation, buildHref } = createRouterCore(
    appRoutes
  )

  type AppLocation = ReturnType<typeof resolveLocation>
  type AppRoute = InferRoute<typeof appRoutes>
  type Router = {
    location: AppLocation
    navigate: (ref: RouteRef<AppRoute>) => void
    buildHref: (ref: RouteRef<AppRoute>) => string
  }

  const RouterContext = createContext<Router>({
    location: notFoundLocation,
    navigate: () => void 0,
    buildHref: () => ''
  })

  function useRouter(initialURL: string): Router {
    const initialLocation = resolveLocation(initialURL)
    const [location, setLocation] = useState(initialLocation)

    useEffect(() => {
      // Are we in the browser environment?
      if (typeof window !== 'undefined') {
        const popStateListener = () => {
          const newLocation = resolveLocation(window.location.href)
          setLocation(newLocation)
        }

        window.addEventListener('popstate', popStateListener)
        return () => window.removeEventListener('popstate', popStateListener)
      }
    }, [])

    // After location change scroll to the element with id equal hash
    // or the top of the page
    useEffect(() => {
      if (location !== initialLocation) {
        const scrollToEl =
          (location.hash && document.getElementById(location.hash)) || undefined
        window.scroll(0, scrollToEl?.offsetTop || 0)
      }
    }, [location])

    function navigate(ref: RouteRef<AppRoute>) {
      const currentLocation = resolveLocation(window.location.href)
      const newLocation = refToLocation(ref)

      if (
        currentLocation.name === ref.name &&
        isEqual(currentLocation.params, ref.params) &&
        isEqual(currentLocation.query, ref.query)
      ) {
        // The current and reference locations are the same

        // If the hash is present and the object with given id is found
        // then scroll to it
        const scrollToEl = ref.hash && document.getElementById(ref.hash)
        if (scrollToEl) window.scroll(0, scrollToEl.offsetTop)
      } else {
        // The locations are different

        // Push state to history
        console.log('Switcher: push state')
        window.history.pushState(null, '', buildHref(ref))
        setLocation(newLocation)
      }
    }

    return { location, navigate, buildHref }
  }

  function RouterLink<
    LinkRoute extends AppRoute,
    ExtraLinkComponentProps = {}
  >({
    to,
    children,
    component,
    ...componentProps
  }: {
    to: RouteRef<LinkRoute>
    children?: ComponentChildren
    component?: ReactElement
  } & ExtraLinkComponentProps) {
    const { navigate } = useContext(RouterContext)
    const href = buildHref(to)
    const allComponentProps = Object.assign(
      {
        href,
        onClick: (e: MouseEvent) => {
          e.preventDefault()
          navigate(to)
        }
      },
      componentProps
    )

    if (component) {
      return cloneElement(component, allComponentProps, children)
    } else {
      return createElement('a', allComponentProps, children)
    }
  }

  return {
    useRouter,
    RouterContext,
    RouterLink,
    resolveLocation,
    refToLocation,
    buildHref
  }
}

function isEqual(objA: any, objB: any): boolean {
  if (typeof objA === 'object' && objA !== null) {
    const objAKeys = Object.keys(objA)
    const objBKeys =
      typeof objB === 'object' && objB !== null && Object.keys(objB)
    if (!objBKeys || objAKeys.length !== objBKeys.length) return false
    return objAKeys.every(key => isEqual(objA[key], objB[key]))
  } else {
    return objA === objB
  }
}
