# Switcher

Type-safe TypeScript-first minimalistic router for React & Preact apps.

**Why?**

- Designed with TypeScript's type inference in mind
- Universal code (browser & Node.js)
- Functional API
- Maximum type-safety
- Autocomplete for routes, params and meta information
- Say goodbye to `any`!
- Say goodbye to exceptions!

## Installation

The library is available as npm packages for [React](https://www.npmjs.com/package/@switcher/react) and [Preact](https://www.npmjs.com/package/@switcher/preact):

```sh
# For React
npm install @switcher/react --save
# Or using Yarn:
yarn add @switcher/react

# For Preact
npm install @switcher/preact --save
# Or using Yarn:
yarn add @switcher/preact
```

## Get started

To start using Switcher you need to add a module to your app, i.e. `router.ts`. There you going to initialize the router and export it's interface to your application.

Here's the router from [Fire Beast blog](https://firebeast.dev/) source code:

> Note that even though the triple call `route('home')('/')()` looks alien, it allows TypeScript to infer dictionary of route names (`home`, `tutorials`, etc.), optional meta information and let you specify the params type.

```ts
// When using with React:
import { createRouter, InferRouteRef, route } from '@switcher/react'
// Or Preact:
import { createRouter, InferRouteRef, route } from '@switcher/preact'

// Routes
export const appRoutes = [
  route('home')('/')(),

  route('tutorial')<{ slug: string }>('/tutorials/:slug')(),

  route('tutorial-chapter')<{ tutorialSlug: string; chapterSlug: string }>(
    '/tutorials/:tutorialSlug/chapters/:chapterSlug'
  )(),

  route('post')<{ categoryId: string; postId: string }>(
    '/:categoryId/:postId'
  )()
]

// Routing methods
export const {
  buildHref,
  useRouter,
  RouterContext,
  RouterLink,
  resolveLocation,
  refToLocation
} = createRouter(appRoutes)

// Type to use in prop definitions
export type AppRouteRef = InferRouteRef<typeof appRoutes>
```

Then you need to initialize the router context in your root component and pass the initial URL:

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterContext, useRouter } from './router'

export default function UI() {
  const router = useRouter(location.href)

  return (
    <RouterContext.Provider value={router}>
      <Content />
    </RouterContext.Provider>
  )
}
```

Then you'll be able to access the router context in nested components and render the corresponding page:

```tsx
// When using with React:
import React, { useContext } from 'preact'
// Or Preact:
import { h } from 'preact'
import { useContext } from 'preact/hooks'

import { RouterContext } from './router'
import HomePage from './HomePage'
import PostPage from './PostPage'
import TutorialPage from './TutorialPage'
import TutorialChapterPage from './TutorialChapterPage'
import NotFoundPage from './NotFoundPage'

export default function Content() {
  const { location } = useContext(RouterContext)

  switch (location.name) {
    case 'home':
      return <HomePage />

    case 'post': {
      const { postId } = location.params
      return <PostPage postId={postId} />
    }

    case 'tutorial': {
      const { slug } = location.params
      return <TutorialPage slug={slug} />
    }

    case 'tutorial-chapter': {
      const { tutorialSlug, chapterSlug } = location.params
      return (
        <TutorialChapterPage
          tutorialSlug={tutorialSlug}
          chapterSlug={chapterSlug}
        />
      )
    }

    case '404':
    default:
      return <NotFoundPage />
  }
}
```

To navigate between the pages you could use `RouterLink` or `navigate` function from the router context:

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterContext, RouterLink } from '#app/router'
import { signOut } from './auth'

export default function Navigation() {
  const { navigate } = useContext(RouterContext)

  return (
    <ul>
      <li>
        <RouterLink to={{ name: 'home' }}>Home</RouterLink>
      </li>

      <li>
        <button onClick={() => signOut().then(() => navigate({ to: 'home' }))}>
          Sign out
        </button>
      </li>
    </ul>
  )
}
```

## API

### `route`

The function creates a route that later can be passed to `createRouter`.

To define a simple route:

```ts
// When using with React:
import { route } from '@switcher/react'
// Or Preact:
import { route } from '@switcher/preact'

route('home')('/')()
```

To define a route with params:

```ts
route('tutorial-chapter')<{ tutorialSlug: string; chapterSlug: string }>(
  '/tutorials/:tutorialSlug/chapters/:chapterSlug'
)()
```

The `route` also allows to pass meta information:

```ts
const routes = [
  route('login')('/login')({ auth: false }),
  route('projects')('/projects')({ auth: true })
]
```

### `createRouter`

The function accepts an array of routes created using `route` and router options and returns the router API with binded types.

```ts
// When using with React:
import { route, createRouter } from '@switcher/react'
// Or Preact:
import { route, createRouter } from '@switcher/preact'

const routes = [
  route('login')('/login')({ auth: false }),
  route('projects')('/projects')({ auth: true })
]

const routerAPI = createRouter(routes, {
  // Configure "missing hash" behavior. When user clicks
  // a hash link (#whatever), the router will try to find
  // an element with id "whatever". When such element
  // is missing:
  // - 'top' (default): scroll to the top
  // - 'preserve': keep the current scroll position
  scrollOnMissingHash: 'preserve'
})
```

The router API consist of these methods:

- [`useRouter`](#userouter)
- [`RouterContext`](#routercontext)
- [`RouterLink`](#routerlink)
- [`resolveLocation`](#resolvelocation)
- [`refToLocation`](#reftolocation)
- [`buildHref`](#buildhref)

See docs below for more information about each of those methods.

#### `useRouter`

React/Preact hook that initializes routing with the current URL and returns component-level router API.

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterContext, useRouter } from './router'

export default function UI() {
  // Initializes router with the initial URL
  const componentRouterAPI = useRouter(location.href)

  return (
    <RouterContext.Provider value={componentRouterAPI}>
      <Content />
    </RouterContext.Provider>
  )
}
```

Right after initializing the router, pass the value to [`RouterContext`](#routercontext), to make it available in nested components.

The component-level router API consist of these methods:

- [`location`](#location)
- [`navigate`](#navigate)
- [`buildHref`](#buildHref)

See docs below for more information about each of those methods.

##### `location`

An object with the information about the current location:

```ts
// Route location for the following URL: https://firebeast.dev/tutorials/firebase-react-quick-start/chapters/firestore-queries?ref=twitter#recap
{
  // The route name
  name: 'tutorial-chapter',
  // The location params
  params: {
    tutorialSlug: 'firebase-react-quick-start',
    chapterSlug: 'firestore-queries'
  },
  // The parsed query
  query: { ref: 'twitter' },
  // The hash
  hash: 'recap',
  // The route meta information (copied from the route definition; in this case undefined)
  meta: undefined
}
```

If the current URL doesn't match to any routes:

```ts
{
  name: '404',
  params: undefined,
  query: {},
  hash: '',
  meta: undefined
}
```

##### `navigate`

TODO

##### `buildHref`

TODO

#### `RouterContext`

TODO

#### `RouterLink`

TODO

#### `resolveLocation`

TODO

#### `refToLocation`

TODO

#### `buildHref`

TODO

## Changelog

See [the changelog](./CHANGELOG.md).

## License

[MIT © Sasha Koss](https://kossnocorp.mit-license.org/)
