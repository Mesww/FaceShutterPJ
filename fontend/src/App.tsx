import './App.css'
import FaceDetection from './components/facedection/facedection'

function App() {

  return (
    <>
  <div>
      <h1>Face Detection Demo</h1>
      <FaceDetection width={640} height={480} modelPath='/models/weights'/>
    </div>
    </>
  )
}

export default App
