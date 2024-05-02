---
marp: true
style: |

  section h1 {
    color: #6042BC;
  }

  section code {
    background-color: #e0e0ff;
  }

  footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
  }

  footer img {
    position: absolute;
    width: 120px;
    right: 20px;
    top: 0;

  }
  section #title-slide-logo {
    margin-left: -60px;
  }
---

# Beyond Request/Response
### Why and how we should change the way we build web applications
Chris Nelson
@superchris
chris@launchscout.com
![h:200](full-color.png#title-slide-logo)

---

<!-- footer: ![](full-color.png) -->
# Who am I?
- 25+ year Web App Developer
- Co-Founder of Launch Scout
- Creator of LiveState

---

# Here is my claim:
## Mainstream web app development compared to 5-10 years ago
- More complex
- Slower
- Less enjoyable
- Not noticeably better

---

# This talk is about..
- What happened
- Why
- How we can make things better

---

# It's also a Design Pattern talk
- We'll get into specific implementation
- But the ideas are more important

---

# First let's talk about how we got here
## A brief history of web development

---

# The dawn of time: 1993-1997
- NCSA Mosaic
- Lynx
- Netscape
- No dynamic anything

---

# CGI: Common Gateway Interface
- the web app equivalent of stone tablets
- Programs invoked by the webserver
- Perl, VB, PL/SQL, you name it!
- This was ok for little tiny things
- For large applications, not so much
- Code organization mostly spaghetti nightmare

---

# The browser wars: 1997-2005ish
- Netscape adds Java/Javascript
- NS owns the browser space
- Microsoft gets scared
- IE gets bundled into Windoze
- IE wins (95%+ by 2004)

---

# Server side MVC

![](web1.png)
- Code organization
- State lives on server (probably in a DB)
- We could build apps really fast
- JS largely ignored

---

# The AJAX era: 2005-2015
- XMLHttpRequest
- DHTML
- Apps can display new stuff without a page reload!
- GMail sets the bar 2004
- Browser innovation stagnates after IE wins

---

# Meanwhile in developer land...
- The user experience got a lot better
- The developer experiences, not so much..
- Things on the client are getting complicated!
- How do we manage the complexity?

---

# The Client side MVC cycle
1. Let's apply same good ideas that worked server side in JS!
2. Let's build a JS MVC framework!
3. Ugghh this one got big and complicated...
4. I know, I'll write a *simple* client side MVC framework
5. Repeat

---

# All the MVCs

![](web2.png)

---

# Congratulations! We are building distributed systems
## And building distributed systems is hard...
- HTTP is stateless, our applications have state
- With server-side MVC we had a place for our state
- Now it lives in (at least) two places..
  - And it's our job to keep it in sync(ish)
- Shared state is hard
  - Shared mutable state is *really* hard

---

# And all that client side code...
- Client side build tools
- Dependency management
- Compilation and transpilation

---

# The modern era: 2015 - present
- Competitive browsers makes standards matter again
- Browser makers are more cooperative than ever before
- Browser innovation has absolutely exploded
  - **faster than developers are able to keep up**

---

# An embarrassment of riches
- Web components (custom HTML elements)
- Websockets
- Javascript maturation
  - Modules
  - Import maps
- Webassembly

---

# We are mostly still coding like its 2015
- Frameworks that reinvent rather than leverage standards
- Transpiling to obsolete JS versions
- Complex builds
- Oscillations between SPA vs server rendered 

---

# Let's see what we can do about that!

---

# First, let's talk about managing state...

---

## We see the same Design Pattern again and again
- Redux
- Elm
- GenServers
- LiveView
- It keeps emerging..

---

# Event/State Reducers
## A functional design pattern for managing state
- Reducer functions which take
  - Event (w/payload)
  - Current state
- And return:
  - A new state

---

# Todo list reducer
* Add item event
  ```js
  todoReducer({name: "Add item", item: "Get Milk"}, [])
  ```
* Returns new state: ```["Get Milk"]```
* Add a second item
  ```js
  todoReducer({name: "Add item", item: "Speak at StirTrek"}, ["Get Milk"])
  ```
* Returns new state: ```["Get Milk", "Speak at StirTrek"]```

---

# Things we like
- Simple and predictable
- Easy to test
- Well suited to async
  - No shared mutable state!

---

# Another simple idea: "dumb" components
- EmberJS (actions up, data down)
- React
- Angular

---

# Components are dumb if...
- render data
  - often passed in as props
- dispatch events
- That's it!

---

# An example: let's make a comment section

---

## `<comments-section>` element
```ts
@customElement('comments-section')
export class CommentsSectionElement extends LitElement {

  @state()
  comments: string[] = [];

  render() {
    return html`
      <ul>
        ${this.comments.map((comment) => html`<li>${comment}</li>`)}
      </ul>
      <form @submit=${this.addComment}>
        <div>
          <label>Comment</label>
          <input name="comment" />
        </div>
        <button>Add comment</button>
      </form>
    `;
  }

  addComment(e: SubmitEvent) {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('add-comment', {detail: {comment: this.commentInput.value}}));
    this.commentInput!.value = '';
  }
}
```
---

# But where do the comments actually go?
## How to send them to server?
- We could make an API
  - REST
  - GraphQL
- Is there a simpler way?

---

## Putting the good ideas together...

---
![](event_reducers.png)

## Client (dumb components)
- render state
- sends events
- receive state changes
## Server
- receive events
- reducer functions compute new state
- send state changes

---

# LiveState
- An implementation of this pattern
- Not the first, not the only
- Client code javascript library
- Server side Elixir library

---

# Finishing our Comment Section
```ts
@customElement('comments-section')
@liveState({
  topic: 'comments:all',
  url: 'ws://localhost:4000/live_state',
  events: {send: ['add-comment']}
})
export class CommentsSectionElement extends LitElement {

  @state()
  @liveStateProperty()
  comments: string[] = [];
...
```
---
# Server side reducer
```elixir
defmodule SimpifiedCommentsWeb.CommentsChannel do
  use LiveState.Channel, web_module: SimpifiedCommentsWeb

  def init(_channel, _params, _socket) do
    {:ok, %{comments: []}}
  end

  def handle_event("add-comment", %{"comment" => comment}, %{comments: comments} = state) do
    {:noreply, Map.put(state, :comments, [comment | comments])}
  end

end
```
---

# Putting it all [together](wobsite.html)
```html
<html>
  <head>
    <script type="module" src="http://localhost:4000/assets/app.js"></script>
  </head>
  <body>
    <h1>Pretend website</h1>

    Comments below...
    
    <comments-section></comments-section>
  </body>
</html>
```

---

# How does this even work?
- `<comments-section>` makes WebSocket bidirectional connection during `connectCallback`
- `add-comment` event listeners are added to push events over the WS connection
- state updates arrive over WS connection
- listeners for state change events update the `comments` property in `<comments-section>`
- `Lit` re-renders on prop changes

---

# But is this actually viable?
- Our state is *all* on the server
- Something needs to hold state for *every connected client*
- This could be millions of stateful connections
- We just went to crazy town right?

---

# The secret sauce: Elixir
- Erlang/OTP: 25 years of distributed computing learning baked in
- Extremely light-weight processes to manage state
  - **Each connection has their own process and state**
- High availabity, concurrent
- Phoenix Channels
  - An thin abstraction over WebSockets
  - Proven to scale to millions of *stateful* connections per server

---

# Why is this pattern better?
- State lives in a single place: the server
  - Not shared
  - Immutable
- This lets us operate at a higher level of abstraction
- Events and state vs request/response

---

## Another benefit: Real time is essentially free!
- Events can come from other sources that user interaction
- Computing state and notifying clients is the same

---

# Real-time comments!

---
## Just sprinkle in some [PubSub...](wobsite.html)
```elixir
defmodule SimpifiedCommentsWeb.CommentsChannel do
  @moduledoc false

  use LiveState.Channel, web_module: SimpifiedCommentsWeb
  alias Phoenix.PubSub

  @impl true
  def init(_channel, _params, _socket) do
    PubSub.subscribe(SimpifiedComments.PubSub, "comments")
    {:ok, %{comments: []}}
  end

  @impl true
  def handle_event("add-comment", %{"comment" => comment}, state) do
    PubSub.broadcast(SimpifiedComments.PubSub, "comments", {:add_comment, comment})
    {:noreply, state}
  end

  @impl true
  def handle_message({:add_comment, comment}, %{comments: comments} = state) do
    {:noreply, Map.put(state, :comments, [comment | comments])}
  end

end

```
---

# Variations on the theme

---

# LiveView
- The original
- Elixir front to back
- Views are rendered in Elixir
- Events dispatched over WebSockets
- View updates received over WebSockets
  - There is javascript, but you don't need to touch it for most app development

---

## Comments LiveView template

```elixir
<dl>
  <%= for comment <- @comments do %>
    <dt><%= comment["author"] %></dt>
    <dd><%= comment["text"] %></dd>
  <% end %>
</dl>
<form phx-submit="add_comment">
  <div>
    <label>Author</label>
    <input name="author" />
  </div>
  <div>
    <label>Comment</label>
    <input name="text" />
  </div>
  <button>Add comment</button>
</form>
```

---

## Comments [LiveView](http://localhost:4000/live_comments)
```elixir
defmodule SimpifiedCommentsWeb.CommentsLive do
  use SimpifiedCommentsWeb, :live_view

  def mount(_parms, _session, socket) do
    {:ok, socket |> assign(:comments, [])}
  end

  def handle_event("add_comment", comment, %{assigns: %{comments: comments}} = socket) do
    {:noreply, socket |> assign(:comments, [comment | comments])}
  end
end
```

---

# LiveTemplates
## Could building an app be as simple as editing an HTML file?

---

# `<live-template>`
- Connects a client side template to a Livestate
- Renders state
- Dispatches events
- Uses sprae for template evaluation
- Get started with only an HTML file

---
## [Comments](./livetemplate-comments.html) in `<live-template>`
```html
<html>
  <head>
    <script type="importmap">
    {
      "imports": {
        "@launchscout/live-template": "https://esm.sh/@launchscout/live-template@0.4.1/index.js"
      }
    }
    </script>
    <script type="module">
      import '@launchscout/live-template';
    </script>
  </head>
  <body>
    <live-template url="ws://localhost:4000/live_state" topic="comments:all">
      <template>
        <ul>
          <li :each="comment in comments" :text="comment"></li>
        </ul>
        <form :sendsubmit="add-comment">
          <label>Comment</label>
          <input name="comment" />
          <button>Add!</button>
        </form>
      </template>
    </live-template>
  </body>
</html>
```
---

# An interesting aside..
- We don't need a build tool to use `live-template`
- import maps are :fire:
- let your browser resolve and fetch dependencies
- Write your app in an html file, or jsbin, or codepen, or ....
- [esm.sh](https://esm.sh) or [jspm.io](https://jspm.io) make it ridonkulously easy

---

# Signals: a standard unit of reactivity
- Reactive primitives for managing application state
- Track access and trigger renders on change
- Rapidly being adopted across JS frameworks
- SolidJS, Preact, Angular, (maybe React?)
- TC39 Proposal

---

# LiveSignals
- bridging a signal to the backend
- Supports Preact and TC39 so far 
- Supporting something else would be a very tiny PR :wink:

---

## [Comment](./livesignal-preact.html) in LiveSignal/Preact
```js
import { h, render } from 'preact';
import htm from 'htm';
import { createPreactSignal } from './live-signals.js';

const [commentSignal, dispatchEvent] = createPreactSignal({ 
  url: 'ws://localhost:4000/live_state',
  topic: 'comments:all',
  initialValue: [],
  path: 'comments'
});
const html = htm.bind(h);

function Comments(props) {
  let comment = '';
  const onInput = event => (comment = event.currentTarget.value);
  const onClick = () => dispatchEvent(new CustomEvent('add-comment', { detail: {comment }}));
  return html`<div>
    <ul>
      ${commentSignal.value.map(comment => html`<li>${comment}</li>`)}
    </ul>
    <input onInput=${onInput} value=${comment} />
    <button onClick=${onClick}>Add!</button>
  </div>`;
}

render(html`<${Comments} />`, document.body);

```

---

# Variations I did't get to
- [LiveViewJS](https://www.liveviewjs.com/) - Javascript
- [HotWire](https://hotwired.dev/) - Ruby
- [LiveWire](https://github.com/livewire/livewire) - PHP
- [Many more...](https://github.com/liveviews/liveviews)

---

# Is anyone using these ideas in production?
- Heck yes
- We've been building LiveView apps for a couple years
- LiveState is newer but starting to catch on
- Our dev experience is radically improved
- We're hitting estimates at a rate we haven't since Rails

---

# Production examples
- [Launch Elements](https://launch-cart-dev.fly.dev/)
  - [Demo](tiny-store.html)
- [LiveRoom.app](https://liveroom.app)
- [Cars.com](https://cars.com)

---

# So how do I choose?
- LiveView is solid and proven if you're all in on Elixir
- LiveState shines for embedded apps
- LiveTemplates is incredibly easy to get started with
- LiveSignals should work with darn near anything

---

## Thanks!

---

# Bonus round!:
- WebAssembly!
- Until fairly recently, not super practical
  - Calling WebAssembly modules with anything other than numbers was a nightmare
- Things like Extism and WebAssembly Components eliminate this hurdle
- Writing event handlers in the language of your choice is now possible!

---

## Livestate [todo list](http://localhost:4004) reducer in Javascript (compiled to wasm)
```js
import { wrap } from "./wrap";

export const init = wrap(function() {
  return { todos: ["Hello", "WASM"]};
});

export const addTodo = wrap(function({ todo }, { todos }) {
  return { todos: [`${todo} from WASM!`, ...todos]};
});

```

---
