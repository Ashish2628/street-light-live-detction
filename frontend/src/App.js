import React from 'react'
import {Routes, Route, browserRouter, BrowserRouter} from "react-router-dom"
import Home from "./pages/Home" ;
import Add_sensor from "./pages/Add_sensor" ;
import Sensors from "./pages/Sensors" ;
import Update from "./pages/Update"
import About from "./pages/About" 
import Report from "./pages/Report"
import 'leaflet/dist/leaflet.css';
export default function App() {
  return(
  <>
     <BrowserRouter>
        <Routes>
           <Route path= "/" exact element={<Home/>}></Route>
           <Route path= "/sensors" exact element={<Sensors/>}></Route>
           <Route path= "/add_sensor" exact element={<Add_sensor/>}></Route>
           <Route path= "/update" exact element={<Update/>}></Route>
           <Route path= "/about" exact element={<About/>}></Route>
           <Route path= "/report" exact element={<Report/>}></Route>
        </Routes>
     </BrowserRouter>  
  </>
  )
}
