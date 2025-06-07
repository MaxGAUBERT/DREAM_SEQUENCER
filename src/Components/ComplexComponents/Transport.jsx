import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { FaPlayCircle, FaStopCircle } from "react-icons/fa";
import { BsFillRecordCircleFill } from "react-icons/bs";
import { MdReplay } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { useHoverInfo } from "../Contexts/HoverInfoContext";
import { useGridData } from "../Contexts/GridData";


export default function Transport({
  isPlaying, 
  setIsPlaying, 
  channelSources, 
  bpm = 120,
  cols = 50 // 50 colonnes comme vous avez mentionné
}) {
  const { createHoverProps } = useHoverInfo();
  const { noteList, grids } = useGridData();
  const sequenceRef = useRef(null);
  const isInitialized = useRef(false);


  // Initialiser Tone.js une seule fois
  const initializeAudio = useCallback(async () => {
    if (isInitialized.current) return;
    
    try {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      isInitialized.current = true;
      console.log("Audio initialisé");
    } catch (error) {
      console.error("Erreur d'initialisation audio:", error);
    }
  }, [bpm]);

  // Convertir les données de grille en pattern jouable
  const createPlayablePattern = useCallback(() => {
    if (!grids || !noteList || !channelSources) return [];

    const pattern = [];
    
    // Pour chaque colonne (temps)
    for (let col = 0; col < cols; col++) {
      const notesToPlay = [];
      
      // Pour chaque ligne (note)
      for (let row = 0; row < grid.length; row++) {
        const rowData = grids[row];
        
        // Si cette cellule est active dans la row
        if (rowData && rowData[col]) {
          const note = noteList[row];
          const cellData = rowData[col];
          const channelId = cellData.channelId || 'default';
          
          if (channelSources[channelId]) {
            notesToPlay.push({
              note: note,
              channelId: channelId,
              sampler: channelSources[channelId] // C'est un Tone.Sampler
            });
          }
        }
      }
      
      pattern.push(notesToPlay);
    }
    
    return pattern;
  }, [grids, noteList, channelSources, cols]);

  // Gérer la lecture/arrêt
  useEffect(() => {
    const handlePlayback = async () => {
      // Nettoyer la séquence existante
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
        sequenceRef.current = null;
        Tone.Transport.stop();
      }

      if (isPlaying && channelSources && Object.keys(channelSources).length > 0) {
        await initializeAudio();

        const pattern = createPlayablePattern();
        
        if (pattern.length === 0) {
          console.log("Aucune note à jouer");
          return;
        }

        console.log("Pattern créé:", pattern);

        // Créer une nouvelle séquence
        sequenceRef.current = new Tone.Sequence((time, step) => {
          // step contient les notes à jouer pour ce temps
          if (step && step.length > 0) {
            step.forEach(({ note, sampler, channelId }) => {
              try {
                if (sampler && sampler.triggerAttackRelease) {
                  // Utiliser triggerAttackRelease pour les Tone.Sampler
                  sampler.triggerAttackRelease(note, "8n", time);
                  console.log(`Playing ${note} on channel ${channelId} at time ${time}`);
                }
              } catch (error) {
                console.error(`Erreur lors de la lecture de ${note}:`, error);
              }
            });
          }
        }, pattern, "16n"); // 16ème de note pour chaque step

        sequenceRef.current.loop = true;
        sequenceRef.current.start(0);
        Tone.Transport.start();
        
        console.log("Séquence démarrée");
      }
    };

    handlePlayback();

    // Cleanup
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
    };
  }, [isPlaying, channelSources, createPlayablePattern, initializeAudio]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.stop();
    };
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    Tone.Transport.stop();
    if (sequenceRef.current) {
      sequenceRef.current.stop();
    }
  }, [setIsPlaying]);

  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  return (
    <div className="absolute top-1 left-1/4 flex flex-row gap-1 z-[1550]">
      <button 
        {...createHoverProps("play")} 
        onClick={handlePlay}
      >
        <FaPlayCircle 
          size={20} 
          color={isPlaying ? "green" : "orange"}
        />
      </button>

      <button 
        {...createHoverProps("stop")} 
        onClick={handleStop}
      >
        <FaStopCircle size={20} color="red"/>
      </button>

      <button {...createHoverProps("record")}>
        <BsFillRecordCircleFill size={20} color="white"/>
      </button>
      
      <button {...createHoverProps("replay record")}>
        <MdReplay size={20} color="white"/>
      </button>

      <button {...createHoverProps("clear record")}>
        <FaRegTrashCan size={20} color="white"/>
      </button>
    </div>
  );
}