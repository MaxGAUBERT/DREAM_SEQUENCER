import * as React from 'react';
import {useState} from 'react';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { TfiMenu } from "react-icons/tfi";

export default function PianoMenu({onCut, onCopy, onPaste}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'grouped-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <TfiMenu size={20} />
      </Button>
      <Menu
        id="grouped-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <ListSubheader>File</ListSubheader>
        <MenuItem onClick={handleClose}>Export as MIDI</MenuItem>
        <MenuItem onClick={handleClose}>Import MIDI</MenuItem>
        <ListSubheader>Edit</ListSubheader>
        <MenuItem onClick={() => {onCut(); handleClose()}}>Cut</MenuItem>
        <MenuItem onClick={() => {onCopy(); handleClose()}}>Copy</MenuItem>
        <MenuItem onClick={()=> {onPaste(); handleClose()}}>Paste</MenuItem>
      </Menu>
    </div>
  );
}
