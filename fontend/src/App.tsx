import './App.css'
import createRoute from "./components/index";
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  const createRoutes = createRoute();
  return (
    <BrowserRouter>
      <Routes>
        {createRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
        </BrowserRouter>)
        
      }
export default App;
