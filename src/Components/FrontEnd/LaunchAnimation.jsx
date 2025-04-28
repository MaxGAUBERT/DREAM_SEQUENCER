import React from "react";
import { Box } from "@mui/material";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MotionIcon = motion(GraphicEqIcon);

const LaunchAnimation = () => {
    const controls = useAnimation();
    const navigate = useNavigate();

    useEffect(() => {
        const runAnimation = async () => {
            // ✅ Pause initiale de 1.5 secondes
            await new Promise((resolve) => setTimeout(resolve, 1500));
      
            // Étape 1 : rotation + rétrécissement
            await controls.start({
              rotateY: 360,
              scale: 0.5,
              transition: { duration: 0.6, ease: "easeInOut" },
            });
      
            // Étape 2 : agrandissement + disparition
            await controls.start({
              scale: 30,
              opacity: 0,
              transition: { duration: 0.6, ease: "easeIn" },
            });
            navigate("/Home");
          };
      
          runAnimation();

         
        
    
    }, [controls, navigate]);



  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        justifyContent: "center",
        alignItems: "center",
        perspective: 1000, // ← important pour effet 3D
        backgroundColor: "gray",
        overflow: "hidden",
      }}
    >
      <MotionIcon
        initial={{ scale: 3, rotateY: 0, opacity: 1 }}
        animate={controls}
        sx={{
          color: "black",
          fontSize: "100px",
          boxShadow: "10px 8px 8px rgba(0, 0, 0, 0.2)",
          transformStyle: "preserve-3d", // ← active le rendu 3D
          transformOrigin: "center center",
        }}
      />
    </Box>
  );
};

export default LaunchAnimation;
