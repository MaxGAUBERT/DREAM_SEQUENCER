import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewProject from "./Components/SystemTools/NewProject";
import ChannelRack from "./Components/ComplexComponents/ChannelRack";
import StripMenu from "./Components/FrontEnd/StripMenu";
import Home from "./Components/Home";
import Grid from "./Components/ComplexComponents/PianoRoll";
import PatternManager from "./Components/ComplexComponents/PatternManager";
import "./App.css"; // ✅ Import ici pour appliquer à toute l'application
import { Box} from "@mui/material";
import LaunchAnimation from "./Components/FrontEnd/LaunchAnimation";
import Playlist from "./Components/ComplexComponents/Playlist";
import ProjectManager from "./Components/SystemTools/ProjectManager";
import ColorProvider from "./Components/Contexts/ColorProvider";
import MainPanel from "./Components/FrontEnd/MainPanel";
function App() {

    return (
        <ColorProvider>
            <BrowserRouter>
                <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                    <Routes>
                        <Route path="/" element={<NewProject />} />
                        <Route path="/LaunchAnimation" element={<LaunchAnimation />} />
                        <Route path="/Home" element={<Home />} />
                        <Route path="/StripMenu" element={<StripMenu />} />
                        <Route path="/ChannelRack" element={<ChannelRack />} />
                        <Route path="/Grid" element={<Grid />} />
                        <Route path="/PatternManager" element={<PatternManager />} />
                        <Route path="/NewProject" element={<NewProject />} />
                        <Route path="/Playlist" element={<Playlist />} />
                        <Route path="/ProjectManager" element={<ProjectManager />} />
                        <Route path="/MainPanel" element={<MainPanel />} />
                    </Routes>
                </Box>
            </BrowserRouter>
        </ColorProvider>
    );
}

export default App;




