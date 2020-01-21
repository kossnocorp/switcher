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
  InferRoute,
  notFoundLocation,
  Route,
  RouteRef
} from './core'
import { useRef } from 'react'

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

  function RouterLink<ExtraLinkComponentProps = {}>({
    to,
    children,
    component,
    ...componentProps
  }: {
    to: AppRef
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

          /*
                    if (mode !== 'block' && (e.metaKey || e.ctrlKey || !props.to)) return
          e.stopPropagation()
          e.preventDefault()
          if (
            props.target === '_blank' ||
            (mode === 'block' && (e.metaKey || e.ctrlKey))
          ) {
            const href = hrefFor(props.to)
            const win = window.open(href, '_blank')
            win && win.focus()
          } else {
            navigate(props.to)
          }
          onClick && onClick(e)
          */

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
