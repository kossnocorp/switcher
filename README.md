# Switcher

Type-safe TypeScript-first minimalistic router for React & Preact apps.

**Why?**

- Designed with TypeScript's type inference in mind
- Universal code (browser & Node.js)
- Functional API
- Complete type-safety
- Autocomplete for routes, params and meta information
- Say goodbye to `any`!
- Say goodbye to exceptions!

**Please note that the library depends on [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), so it works only in [the browsers that support it](https://caniuse.com/#search=proxy) (meaning no IE support)**

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

```ts
// When using with React:
import { createRouter, InferRouteRef, route } from '@switcher/react'
// Or Preact:
import { createRouter, InferRouteRef, route } from '@switcher/preact'

// Routes

export const appRoutes = [
  route('home', () => '/'),

  route('tutorial', (params: { slug: string }) => `/tutorials/${params.slug}`),

  route(
    'tutorial-chapter',
    (params: { tutorialSlug: string; chapterSlug: string }) =>
      `/tutorials/${params.tutorialSlug}/chapters/${params.chapterSlug}`
  ),

  route(
    'post',
    (params: { categoryId: string; postId: string }) =>
      `/${params.categoryId}/${params.postId}`
  )
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
import React, { useContext } from 'react'
// Or Preact:
import { h } from 'preact'
import { useContext } from 'preact/hooks'

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

route('home', '/')
```

To define a route with params:

```ts
route(
  'tutorial-chapter',
  (params: { tutorialSlug: string; chapterSlug: string }) =>
    `/tutorials/${params.tutorialSlug}/chapters/${params.chapterSlug}`
)
```

The `route` also allows to pass meta information:

```ts
const routes = [
  route('login', '/login', { auth: false }),
  route('projects', '/projects', { auth: true })
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
  route('login', '/login', { auth: false }),
  route('projects', '/projects', { auth: true })
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

- [`location`](#location-component-level-api)
- [`navigate`](#navigate-component-level-api)
- [`buildHref`](#buildhref-component-level-api)

See docs below for more information about each of those methods.

##### `location` (component-level API)

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

##### `navigate` (component-level API)

The function performs navigation to the given route reference:

```ts
// Navigate to the home route
navigate({ name: 'home' })

// Navigate to route with params, query and hash
navigate({
  name: 'tutorial-chapter',
  params: {
    tutorialSlug: 'firebase-react-quick-start',
    chapterSlug: 'firestore-queries'
  },
  query: { ref: 'twitter' },
  hash: 'recap'
})
```

##### `buildHref` (component-level API)

The function builds href to the given route reference:

```ts
buildHref({ name: 'home' })
//=> "/"

buildHref({
  name: 'tutorial-chapter',
  params: {
    tutorialSlug: 'firebase-react-quick-start',
    chapterSlug: 'firestore-queries'
  },
  query: { ref: 'twitter' },
  hash: 'recap'
})
//=> "/tutorials/firebase-react-quick-start/chapters/firestore-queries?ref=twitter#recap"
```

#### `RouterContext`

React/Preact context that propagates the component-level API.

First, initialize the router using [`useRouter`](#userouter) and pass the component-level API to `RouterContext.Provider`:

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterContext, useRouter } from './router'

export default function UI() {
  const componentRouterAPI = useRouter(location.href)

  return (
    <RouterContext.Provider value={componentRouterAPI}>
      <Content />
    </RouterContext.Provider>
  )
}
```

Then use `useContext` to access it:

```tsx
// When using with React:
import React, { useContext } from 'react'
// Or Preact:
import { h } from 'preact'
import { useContext } from 'preact/hooks'

import { RouterContext } from '#app/router'
import { signOut } from './auth'

export default function SignOutButton() {
  const { navigate } = useContext(RouterContext)

  return (
    <button onClick={() => signOut().then(() => navigate({ to: 'home' }))}>
      Sign out
    </button>
  )
}
```

#### `RouterLink`

React/Preact component that renders `a` element with binded `href`, `onClick`, etc. props:

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterLink } from './router'
import { Post } from './types'

export default function PostsList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.ref.id}>
          <RouterLink to={{ name: 'post', params: { postId: post.ref.id } }}>
            {post.data.title}
          </RouterLink>
        </li>
      ))}
    </ul>
  )
}
```

You can customize the rendered component using `component` prop:

```tsx
// When using with React:
import React, { ReactNode } from 'react'
// On with Preact:
import { h, ComponentChildren } from 'preact'

import { RouterLink, AppRouteRef } from './router'
import { ButtonProps, Button } from './Button'

type Props = {
  to: AppRouteRef
  // When using with React:
  children?: ReactNode[]
  // On with Preact:
  children?: ComponentChildren
} & ButtonProps

export default function ButtonLink({ to, children, ...props }: Props) {
  return (
    <RouterLink to={to} component={<Button tag="a" {...props} />}>
      {children}
    </RouterLink>
  )
}
```

The component also can render a block (`div` by default) instead of an anchor. Set `mode` prop to `block`:

```tsx
// When using with React:
import React from 'react'
// Or Preact:
import { h } from 'preact'

import { RouterLink } from './router'
import { Post } from './types'

export default function PostsList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <RouterLink
          mode="block"
          tag="li"
          to={{ name: 'post', params: { postId: post.ref.id } }}
          key={post.ref.id}
        >
          <RouterLink to={{ name: 'post', params: { postId: post.ref.id } }}>
            {post.data.title}
          </RouterLink>

          <ul>
            {post.data.tags.map(tag => (
              <li>
                <RouterLink to={{ name: 'tag', params: { tag } }}>
                  {tag}
                </RouterLink>
              </li>
            ))}
          </ul>
        </RouterLink>
      ))}
    </ul>
  )
}
```

#### `resolveLocation`

The function accepts URL string and returns a location object:

```ts
resolveLocation(
  'https://firebeast.dev/tutorials/firebase-react-quick-start/chapters/firestore-queries?ref=twitter#recap'
)
//=> {
//=>   name: 'tutorial-chapter',
//=>   params: {
//=>     tutorialSlug: 'firebase-react-quick-start',
//=>     chapterSlug: 'firestore-queries'
//=>   },
//=>   query: { ref: 'twitter' },
//=>   hash: 'recap',
//=>   meta: undefined
//=> }
```

#### `refToLocation`

The function accepts a reference object and returns corresponding location object:

```ts
refToLocation({
  name: 'tutorial-chapter',
  params: {
    tutorialSlug: 'firebase-react-quick-start',
    chapterSlug: 'firestore-queries'
  },
  query: { ref: 'twitter' },
  hash: 'recap'
})
//=> {
//=>   name: 'tutorial-chapter',
//=>   params: {
//=>     tutorialSlug: 'firebase-react-quick-start',
//=>     chapterSlug: 'firestore-queries'
//=>   },
//=>   query: { ref: 'twitter' },
//=>   hash: 'recap',
//=>   meta: undefined
//=> }
```

#### `buildHref`

The function builds href to the given route reference:

```ts
buildHref({ name: 'home' })
//=> "/"

buildHref({
  name: 'tutorial-chapter',
  params: {
    tutorialSlug: 'firebase-react-quick-start',
    chapterSlug: 'firestore-queries'
  },
  query: { ref: 'twitter' },
  hash: 'recap'
})
//=> "/tutorials/firebase-react-quick-start/chapters/firestore-queries?ref=twitter#recap"
```

## Changelog

See [the changelog](./CHANGELOG.md).

## License

[MIT © Sasha Koss](https://kossnocorp.mit-license.org/)
