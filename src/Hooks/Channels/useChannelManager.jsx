// assigner un sample à un canal
export const assignSampleToInstrument = useCallback((instrumentName, sample) => {
    setInstrumentList(prev => {
      const url = sample.url; // toujours une URL string

      return {
        ...prev,
        [instrumentName]: {
          ...prev[instrumentName],

          sample: {
            id: sample.id,
            url,
            urls: { C4: url },
            name: sample.name
          },

          sampleUrl: url,
          fileName: url.split("/").pop(),

          sampler: new Tone.Sampler({
            urls: { C4: url }
          }).toDestination()
        }
      };
    });
}, []);

// réinit. le sample par défaut
export const resetSampleForInstrument = useCallback((instrumentName) => {
  setInstrumentList(prev => {
    const inst = prev[instrumentName];
    if (!inst) return prev;

    const defaultUrl = DEFAULT_SAMPLES[instrumentName];

    // 1. Détruire l'ancien sampler dans ChannelProvider
    unloadSample(instrumentName);

    // 2. Recharger le sampler par défaut dans ChannelProvider
    loadSample(instrumentName, defaultUrl);

    // 3. Mettre à jour l'état React
    return {
      ...prev,
      [instrumentName]: {
        ...inst,

        sample: {
          id: null,
          url: defaultUrl,
          urls: { C4: defaultUrl },
          name: instrumentName
        },

        sampleUrl: defaultUrl,
        fileName: defaultUrl.split("/").pop(),

        sampler: null // DrumRack utilisera getSampler()
      }
    };
  });
}, [DEFAULT_SAMPLES]);

export  const applyInstrumentChange = useCallback((updateFn) => {
    setInstrumentList((prev) => {
        const updated = updateFn(prev);
        return updated;
    });
}, []);

export const getInstrumentListSnapshot = useCallback(() => {
    return structuredClone(instrumentList);
}, [instrumentList]);


export const updateInstrumentSlot = useCallback((channelId, newSlot) => {
      setInstrumentList(prev => {
        if (!prev[channelId]) {
          return prev;
        }

        const updated = {
          ...prev,
          [channelId]: {
              ...prev[channelId], slot: Number(newSlot),
          },
        }
        return updated;
      });
}, [instrumentList])



