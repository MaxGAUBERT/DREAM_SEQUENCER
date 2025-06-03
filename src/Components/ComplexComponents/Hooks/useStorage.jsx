import { useState, useCallback, useEffect } from 'react';

export const useStorage = ({
  patterns,
  channelSources,
  grids,
  setPatterns,
  setGrids,
  setProjectName,
  projectName,
  setRows,
  setCols,
  setChannelSources,
  setPlayers,
  defaultRows = 8,
  defaultCols = 50,
}) => {
  const [projectsList, setProjectsList] = useState({});

  // Créer les données du projet avec la structure correcte
  const createProjectData = useCallback(() => {
    // S'assurer que les grids des patterns sont à jour
    const updatedPatterns = patterns.map(pattern => ({
      ...pattern,
      grids: pattern.id === (patterns.find(p => p.grids === grids)?.id) ? grids : pattern.grids
    }));

    return {
      players: channelSources, // Sources audio
      grids, // Grids actuelles
      patterns: updatedPatterns, // Patterns avec grids mises à jour
      // Métadonnées supplémentaires pour le debug
      metadata: {
        savedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
  }, [channelSources, grids, patterns, , defaultRows, defaultCols]);

  // Charger un projet
  const handleLoadProject = useCallback((projectName, projectData) => {
    console.log('🔄 Chargement du projet:', projectName);
    console.log('📊 Données à charger:', projectData);
    
    try {
      // 1. Charger les patterns en premier
      if (projectData.patterns && Array.isArray(projectData.patterns)) {
        console.log('📝 Chargement des patterns:', projectData.patterns);
        setPatterns(projectData.patterns);
      }

      // 2. Charger les grids globales
      if (projectData.grids) {
        console.log('🎹 Chargement des grids:', projectData.grids);
        setGrids(projectData.grids);
      }

      if (projectData.players) {
        console.log('🎹 Chargement des players:', projectData.players);
        setPlayers(projectData.players);
      }



     

      // 5. Définir le nom du projet
      setProjectName(projectName);
      
      console.log('✅ Projet chargé avec succès:', projectName);
    } catch (error) {
      console.error('❌ Erreur lors du chargement du projet:', error);
      alert('Erreur lors du chargement du projet. Vérifiez la console pour plus de détails.');
    }
  }, [setPatterns, setGrids, setChannelSources, setPlayers, setRows, setCols, setProjectName, defaultRows, defaultCols]);

  // Sauvegarder le projet actuel
  const handleSaveCurrentProject = useCallback(() => {
    if (!projectName?.trim()) {
      alert('Veuillez d\'abord nommer votre projet');
      return;
    }
    
    const projectData = createProjectData();
    console.log('💾 Sauvegarde du projet:', projectName);
    console.log('📊 Données sauvegardées:', projectData);
    
    setProjectsList(prev => ({
      ...prev,
      [projectName]: projectData
    }));
    
    // Sauvegarder en localStorage aussi
    try {
      const allProjects = JSON.parse(localStorage.getItem('dreamSequencerProjects') || '{}');
      allProjects[projectName] = projectData;
      localStorage.setItem('dreamSequencerProjects', JSON.stringify(allProjects));
      console.log('✅ Projet sauvegardé:', projectName);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }, [projectName, createProjectData]);

  // Sauvegarder sous un nouveau nom
  const handleSaveAs = useCallback(() => {
    const newName = prompt('Nom du nouveau projet:');
    if (!newName?.trim()) return;
    
    const projectData = createProjectData();
    console.log('💾 Sauvegarde sous:', newName);
    
    setProjectsList(prev => ({
      ...prev,
      [newName]: projectData
    }));
    
    try {
      const allProjects = JSON.parse(localStorage.getItem('dreamSequencerProjects') || '{}');
      allProjects[newName] = projectData;
      localStorage.setItem('dreamSequencerProjects', JSON.stringify(allProjects));
      setProjectName(newName);
      console.log('✅ Projet sauvegardé sous:', newName);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }, [createProjectData, setProjectName]);

  // Supprimer tous les projets
  const clearProjects = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les projets ?')) {
      setProjectsList({});
      localStorage.removeItem('dreamSequencerProjects');
      console.log('🗑️ Tous les projets supprimés');
    }
  }, []);

  // Charger les projets depuis localStorage au démarrage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dreamSequencerProjects');
      if (saved) {
        const projects = JSON.parse(saved);
        console.log('📂 Projets chargés depuis localStorage:', Object.keys(projects));
        setProjectsList(projects);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
    }
  }, []);

  return {
    projectName,
    projectsList,
    handleSaveCurrentProject,
    handleSaveAs,
    handleLoadProject,
    clearProjects,
    datasToSave: createProjectData(),
  };
};