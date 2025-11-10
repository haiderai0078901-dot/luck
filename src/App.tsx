
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import ErrorBoundary from './components/base/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
