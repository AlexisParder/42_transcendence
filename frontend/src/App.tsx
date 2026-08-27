import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { authClient } from './lib/auth-client'
import { Terms } from './pages/Terms'
import { Privacy } from './pages/Privacy'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <PageError />,
    children: [
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'terms',
        element: <Terms />
      },
      {
        path: 'privacy',
        element: <Privacy />
      }
    ]
  }
])

function PageError() {
  // const error = useRouteError()

  return <>
    <h1>Error</h1>
    {/* <p>
      {error?.error?.toString() ?? error?.toString()}
    </p> */}
  </>
}

// Exemple pour la navbar
function Root() {
  const { data: session, isPending } = authClient.useSession()
  return (
    <div className="flex flex-col min-h-screen">
      {/* <header>
        <nav>
          <NavLink to="/">Home</NavLink><span> </span> 
          <NavLink to="/register">Register</NavLink><span> </span>
          <NavLink to="/login">Login</NavLink>
        </nav>
      </header> */}
      <main className='flex-1 flex flex-col'>
        {isPending && <p>Chargement...</p>}
        {!isPending && session ? <p>Connecté en tant que {session.user.username}</p> : <p>Pas connecté</p>}
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return <RouterProvider router={router} />
}

export default App
