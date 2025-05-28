import { TextField, Box, IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";

export const PatternRenamer = ({ selectedPattern, renamePattern}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");

    const handleSubmit = () => {
        renamePattern(name);
        setIsEditing(false);
    }

    useEffect(() => {
        setName(selectedPattern?.name || "");
    },[selectedPattern])

    return (
    <>
      {isEditing ? (
        <TextField
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
          size="small"
          sx={{ bgcolor: "gray", position: "absolute", top: 45, left: 10}}
        />
      ) : (
        <Box>
          <IconButton size="small" onClick={() => setIsEditing(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </>
  );
}