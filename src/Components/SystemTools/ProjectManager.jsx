import { useState } from "react";
import { Button, MenuItem, Select, Box, InputLabel, FormControl, Typography } from "@mui/material";

const ProjectManager = ({ projects, onLoadProject, onDeleteProject, datasToSave, loadView, setLoadView }) => {
  const [selectedProject, setSelectedProject] = useState("");

  const handleSelect = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleLoad = () => {
    if (selectedProject && datasToSave) {
      onLoadProject(selectedProject);
    }
  };

  return (
    <Box sx={{
      position: "absolute",
      width: "400px",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      bgcolor: "white",
      p: 3,
      borderRadius: 1,
      boxShadow: 24,
      zIndex: 1000
    }}>
      <Typography variant="h6" mb={2}>Load a project</Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="project-select-label">Available projects</InputLabel>
        <Select
          labelId="project-select-label"
          value={selectedProject}
          onChange={handleSelect}
          label="Available projects"
        >
          {projects && Object.entries(projects).map(([name, data]) => {
            const patternCount = data.patterns?.length || 0;
            return (
              <MenuItem key={name} value={name}>
                {name} ({patternCount} pattern{patternCount !== 1 ? "s" : ""})
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => setLoadView(!loadView)} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleLoad}
          disabled={!selectedProject}
          color="primary"
        >
          Load
        </Button>
        <Button onClick={onDeleteProject} color="error">
          Delete All Projects
        </Button>
      </Box>
    </Box>
    );
};

export default ProjectManager;
