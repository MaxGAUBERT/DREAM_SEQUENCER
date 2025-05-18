import { Paper, Box, Typography, Button, ListSubheader } from "@mui/material";
import React from "react";
import { useState } from "react";

export default function PluginViewer({ plugin, onClose }) {


    const handleClose = () => {
        onClose();
    };
    
    return (
        <Box
            sx={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 800,
                height: 600,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
            }}
        >
            <ListSubheader sx={{ bgcolor: "#2a2a2a", color: "white", textAlign: "center" }}>
                Plugin Viewer
            </ListSubheader>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    {plugin.name}
                </Typography>
                <img src={plugin.image} alt={plugin.name} style={{ width: "100%", height: "auto", borderRadius: 4 }} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                    {plugin.description}
                </Typography>
                <Button variant="contained" color="primary" onClick={handleClose} sx={{ mt: 2 }}>
                    Close
                </Button>
            </Box>
        </Box>
    );
}

