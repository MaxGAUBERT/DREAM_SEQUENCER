import React from 'react';
import SoundBrowser from "../ComplexComponents/SoundBrowser";
import Playlist from '../ComplexComponents/Playlist';

const ComponentManager = ({ playlistProps, openComponents, children, onMouseEnter, onMouseLeave }) => {
  return (
    <>
      {children}
      {openComponents.Browser && 
        <SoundBrowser 
          onMouseEnter={() => onMouseEnter("Import samples")} 
          onMouseLeave={onMouseLeave}
        />
      }
      {openComponents.Playlist && 
        <Playlist 
          {...playlistProps} 
          onMouseEnter={() => onMouseEnter("Place patterns")} 
          onMouseLeave={onMouseLeave}
        />
      }
    </>
  );
};

export default ComponentManager;