import AddPattern from "./AddPattern";
import DeletePattern from "./DeletePattern";
import DeleteAllPatterns from "./DeleteAllPatterns";
import ResetPattern from "./ResetPattern";
const PatternSelector = ({ patterns, setPatterns, colorByIndex, initLength, onSelect, selectedPatternID, setInstrumentList }) => {
  
  return (
    <div className="flex gap-4 p-2 absolute bottom-0 border-4 w-screen overflow-auto border-gray-700">
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          onClick={() => onSelect(pattern.id)}
          className={`w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out ${
            selectedPatternID === pattern.id ? "border-white" : "border-transparent"
          } ${pattern.color}`}
          title={pattern.name}
        >
          {pattern.id + 1}
        </button>
      ))}

      <AddPattern onSelect={onSelect} patterns={patterns} setPatterns={setPatterns} colorByIndex={colorByIndex} setInstrumentList={setInstrumentList}/>
      
      <DeletePattern patterns={patterns} setPatterns={setPatterns} />

      <DeleteAllPatterns patterns={patterns} setPatterns={setPatterns} setInstrumentList={setInstrumentList} selectedPatternID={selectedPatternID} onSelect={onSelect}/>

      <ResetPattern patterns={patterns} setPatterns={setPatterns} colorByIndex={colorByIndex} initLength={initLength} onSelect={onSelect} setInstrumentList={setInstrumentList}/>
     
    </div>
  );
};

export default PatternSelector;