import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

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
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return <RouterProvider router={router} />
}

export default App
