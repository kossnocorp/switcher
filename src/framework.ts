import * as adaptor from './adaptor'
import * as core from './core'

export type RouterOptions = {
  scrollOnMissingHash?: 'top' | 'preserve'
}

export function createRouter<
  AppRoutes extends Array<core.Route<any, any, any>>
>(appRoutes: AppRoutes, options: RouterOptions = {}) {
  // Default options
  options.scrollOnMissingHash = options.scrollOnMissingHash || 'top'

  const { resolveLocation, refToLocation, buildHref } = core.createRouterCore(
    appRoutes
  )

  type AppLocation = ReturnType<typeof resolveLocation>
  type AppRoute = core.InferRoute<typeof appRoutes>
  type AppRef = core.RouteRef<AppRoute>
  type Router = {
    location: AppLocation
    navigate: (ref: AppRef, landing?: core.LandingProps) => void
    redirect: (
      ref: AppRef,
      landing?: Omit<core.LandingProps, 'redirected'>
    ) => void
    buildHref: (ref: AppRef) => string
  }

  const RouterContext = adaptor.createContext<Router>({
    location: core.notFoundLocation,
    navigate: () => void 0,
    redirect: () => void 0,
    buildHref: () => ''
  })

  // Initial values
  let historyIndex = 0

  function useRouter(initialURL: string): Router {
    const initialLocation = resolveLocation(initialURL)
    const [location, setLocation] = adaptor.useState(initialLocation)

    adaptor.useEffect(() => {
      // Are we in the browser environment?
      if (typeof window !== 'undefined') {
        let negateEvent = false
        const popStateListener = (e: PopStateEvent) => {
          if (negateEvent) {
            negateEvent = false
            return
          }
          const popIndex = e.state?.index === 'number' ? e.state.index : 0
          const delta = popIndex < historyIndex ? -1 : 1
          historyIndex = popIndex

          confirmUnload(
            true,
            () => {
              const newLocation = resolveLocation(window.location.href)
              setLocation(newLocation)
            },
            () => {
              negateEvent = true
              history.go(-delta)
            }
          )
        }

        window.addEventListener('popstate', popStateListener)
        return () => window.removeEventListener('popstate', popStateListener)
      }
    }, [])

    // After location change scroll to the element with id equal hash
    // or the top of the page
    const prevLocation = adaptor.useRef(initialLocation)
    adaptor.useEffect(() => {
      // Skip on initial run
      if (location !== initialLocation) {
        const scrollToEl =
          (location.hash && document.getElementById(location.hash)) || undefined
        if (scrollToEl) {
          // If there's hash and element with id equal hash is found
          // then scroll to it.
          window.scroll(0, elementTop(scrollToEl))
        } else if (
          // If it's not the same page..
          !isSamePage(location, prevLocation.current) ||
          // ...or hash changed but the element is not found
          (location.hash !== prevLocation.current.hash &&
            options.scrollOnMissingHash === 'top')
        ) {
          window.scroll(0, 0)
        }
      }
      prevLocation.current = location
    }, [location])

    function navigate(
      ref: AppRef,
      { unloading = true, redirected, replaced }: core.LandingProps = {}
    ) {
      const landing = { unloading, redirected }
      const currentLocation = resolveLocation(window.location.href)
      const newLocation = refToLocation(ref, landing)

      confirmUnload(!unloading, () => {
        if (isSamePage(currentLocation, ref)) {
          // If the hash is present and the object with given id is found
          // then scroll to it
          const scrollToEl = ref.hash && document.getElementById(ref.hash)
          if (scrollToEl) window.scroll(0, elementTop(scrollToEl))
        } else if (replaced) {
          // Replace the state in the history
          window.history.replaceState(
            { index: historyIndex },
            '',
            buildHref(ref)
          )
          setLocation(newLocation)
        } else {
          // Push the state to the history
          historyIndex++
          window.history.pushState({ index: historyIndex }, '', buildHref(ref))
          setLocation(newLocation)
        }
      })
    }

    function redirect(
      ref: AppRef,
      landing?: Omit<core.LandingProps, 'redirected'>
    ) {
      navigate(ref, { unloading: false, ...landing, redirected: true })
    }

    return { location, navigate, redirect, buildHref }
  }

  function RouterLink<
    ExtraLinkComponentProps extends { [key: string]: any } = {}
  >({
    to,
    target,
    rel,
    mode = 'anchor',
    tag,
    children,
    component,
    onClick: customOnClick,
    ...componentProps
  }: {
    to: AppRef
    target?: string
    rel?: string
    mode?: 'anchor' | 'block'
    tag?: string
    children?: adaptor.ComponentChildren
    component?: adaptor.ReactElement
    onClick?: (e: MouseEvent) => any
  } & ExtraLinkComponentProps) {
    const { navigate } = adaptor.useContext(RouterContext)
    const href = buildHref(to)
    const componentTag = tag || mode === 'anchor' ? 'a' : 'div'

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
        window.open(href, '_blank', features.join(','))
      } else {
        navigate(to)
      }
    }

    const props =
      mode === 'anchor'
        ? Object.assign({ onClick, href, target, rel }, componentProps)
        : Object.assign({ onClick }, componentProps)

    if (component) {
      return adaptor.cloneElement(component, props, children)
    } else {
      return adaptor.createElement(componentTag, props, children)
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

function elementTop(element: HTMLElement) {
  return window.scrollY + element.getBoundingClientRect().y
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

function confirmUnload(
  force: boolean,
  confirmCallback: () => void,
  cancelCallback?: () => void
) {
  if (force) {
    confirmCallback()
  } else {
    class BeforeUnloadEventPhony extends Event {
      _returnValue: any

      constructor() {
        super('beforeunload')
      }

      get returnValue() {
        return this._returnValue
      }
      set returnValue(value: any) {
        this._returnValue = value
      }
    }

    const unloadEvent: BeforeUnloadEvent = new BeforeUnloadEventPhony()

    const listener = (e: BeforeUnloadEvent) => {
      if (!e.returnValue || confirm(e.returnValue)) confirmCallback()
      else cancelCallback?.()
      window.removeEventListener('beforeunload', listener)
    }

    window.addEventListener('beforeunload', listener)
    window.dispatchEvent(unloadEvent)
  }
}
