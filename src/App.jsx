import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewProject from "./Components/StorageManager/HomePage";
import ChannelRack from "./Components/ComplexComponents/ChannelRack";
import StripMenu from "./Components/FrontEnd/StripMenu";
import Home from "./Components/Home";
import Grid from "./Components/ComplexComponents/PianoRoll";
import PatternManager from "./Components/ComplexComponents/PatternManager";
import "./App.css"; // ✅ Import ici pour appliquer à toute l'application
import LaunchAnimation from "./Components/FrontEnd/LaunchAnimation";
import ProjectLoader from "./Components/StorageManager/ProjectLoader";
import ColorProvider from "./Components/Contexts/ColorProvider";
import MainPanel from "./Components/FrontEnd/MainPanel";
import HomePage from "./Components/StorageManager/HomePage";
function App() {

    return (
        <ColorProvider>
            <BrowserRouter>
                <div className="flex flex-col h-100vh">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/LaunchAnimation" element={<LaunchAnimation />} />
                        <Route path="/Home" element={<Home />} />
                        <Route path="/StripMenu" element={<StripMenu />} />
                        <Route path="/ChannelRack" element={<ChannelRack />} />
                        <Route path="/Grid" element={<Grid />} />
                        <Route path="/PatternManager" element={<PatternManager />} />
                        <Route path="/HomePage" element={<HomePage />} />
                        <Route path="/ProjectLoader" element={<ProjectLoader />} />
                        <Route path="/MainPanel" element={<MainPanel />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </ColorProvider>
    );
}

export default App;




