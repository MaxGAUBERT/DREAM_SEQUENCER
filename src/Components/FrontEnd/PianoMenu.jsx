import {useState} from 'react';
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
    <div className="relative inline-block text-left">
      <button
        id="basic-button"
        aria-haspopup="true"
        aria-expanded={open ? "true" : "false"}
        onClick={handleClick}
        className="p-2 text-white hover:bg-gray-700 rounded"
      >
        <TfiMenu size={20} />
      </button>

      {open && (
        <div
          id="grouped-menu"
          className="absolute z-10 mt-2 w-40 bg-gray-800 text-white shadow-lg ring-1 ring-black ring-opacity-5"
          role="menu"
          aria-labelledby="basic-button"
        >
          <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-400">File</div>
          <button
            onClick={() => handleClose()}
            className="w-full text-left px-4 py-2 hover:bg-gray-700"
            role="menuitem"
          >
            Export as MIDI
          </button>
          <button
            onClick={() => handleClose()}
            className="w-full text-left px-4 py-2 hover:bg-gray-700"
            role="menuitem"
          >
            Import MIDI
          </button>

          <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-400">Edit</div>
          <button
            onClick={() => {
              onCut();
              handleClose();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-700"
            role="menuitem"
          >
            Cut
          </button>
          <button
            onClick={() => {
              onCopy();
              handleClose();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-700"
            role="menuitem"
          >
            Copy
          </button>
          <button
            onClick={() => {
              onPaste();
              handleClose();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-700"
            role="menuitem"
          >
            Paste
          </button>
        </div>
      )}
    </div>
  );
}