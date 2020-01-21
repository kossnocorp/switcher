import {
  cloneElement,
  ComponentChildren,
  createContext,
  createElement,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState
} from './adaptor'
import {
  createRouterCore,
  InferRoute,
  notFoundLocation,
  Route,
  RouteRef
} from './core'

export type RouterOptions = {
  scrollOnMissingHash?: 'top' | 'preserve'
}

export function createRouter<AppRoutes extends Array<Route<any, any, any>>>(
  appRoutes: AppRoutes,
  options: RouterOptions = {}
) {
  const { resolveLocation, refToLocation, buildHref } = createRouterCore(
    appRoutes
  )

  type AppLocation = ReturnType<typeof resolveLocation>
  type AppRoute = InferRoute<typeof appRoutes>
  type AppRef = RouteRef<AppRoute>
  type Router = {
    location: AppLocation
    navigate: (ref: AppRef) => void
    buildHref: (ref: AppRef) => string
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
    const prevLocation = useRef(initialLocation)
    useEffect(() => {
      if (location !== initialLocation) {
        const scrollToEl =
          (location.hash && document.getElementById(location.hash)) || undefined
        if (scrollToEl) {
          window.scroll(0, scrollToEl.offsetTop)
        } else if (
          options.scrollOnMissingHash !== 'preserve' ||
          isSamePage(location, prevLocation.current)
        ) {
          window.scroll(0, 0)
        }
      }
      prevLocation.current = location
    }, [location])

    function navigate(ref: AppRef) {
      const currentLocation = resolveLocation(window.location.href)
      const newLocation = refToLocation(ref)

      if (isSamePage(currentLocation, ref)) {
        // If the hash is present and the object with given id is found
        // then scroll to it
        const scrollToEl = ref.hash && document.getElementById(ref.hash)
        if (scrollToEl) window.scroll(0, scrollToEl.offsetTop)
      } else {
        // Push state to history
        window.history.pushState(null, '', buildHref(ref))
        setLocation(newLocation)
      }
    }

    return { location, navigate, buildHref }
  }

  function RouterLink<
    ExtraLinkComponentProps extends { [key: string]: any } = {}
  >({
    to,
    target,
    rel,
    mode = 'anchor',
    children,
    component,
    onClick: customOnClick,
    ...componentProps
  }: {
    to: AppRef
    target?: string
    rel?: string
    mode?: 'anchor' | 'block'
    children?: ComponentChildren
    component?: ReactElement
    onClick?: (e: MouseEvent) => any
  } & ExtraLinkComponentProps) {
    const { navigate } = useContext(RouterContext)
    const href = buildHref(to)

    const onClick = (e: MouseEvent) => {
      // Handle the custom click handler
      customOnClick && customOnClick(e)

      // If default behavior got prevented by the custom click handler or
      // the mode is "anchor" (default) and user clicks the link with
      // the command or control key then use default browser behavior.
      if (e.defaultPrevented || (mode !== 'block' && (e.metaKey || e.ctrlKey)))
        return

      // Otherwise, prevent the default behavior and stop propogation.
      e.preventDefault()
      e.stopPropagation()

      // When the target attribute is "_blank" or the mode is "block" and
      // user clicks the link with the command or control key
      // then open the link in a new window.
      if (
        componentProps.target === '_blank' ||
        (mode === 'block' && (e.metaKey || e.ctrlKey))
      ) {
        // Preserve noreferrer and noopener
        const features: string[] = []
        if (typeof componentProps.rel === 'string') {
          if (componentProps.rel.includes('noreferrer'))
            features.push('noreferrer')
          if (componentProps.rel.includes('noopener')) features.push('noopener')
        }
        const win = window.open(href, '_blank', features.join(','))
        win && win.focus()
      } else {
        navigate(to)
      }
    }

    const props =
      mode === 'anchor'
        ? Object.assign({ onClick, href, target, rel }, componentProps)
        : Object.assign({ onClick }, componentProps)

    if (component) {
      return cloneElement(component, props, children)
    } else {
      if (mode === 'anchor') {
        return createElement('a', props, children)
      } else {
        return createElement('div', props, children)
      }
    }
  }

  function isSamePage(
    locationA: AppLocation | AppRef,
    locationB: AppLocation | AppRef
  ) {
    return (
      locationA.name === locationB.name &&
      isEqual(locationA.params, locationB.params) &&
      isEqual(locationA.query, locationB.query)
    )
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
