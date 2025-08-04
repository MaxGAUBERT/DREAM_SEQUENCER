import AddPattern from "./AddPattern";
import DeletePattern from "./DeletePattern";
import DeleteAllPatterns from "./DeleteAllPatterns";
import ResetPattern from "./ResetPattern";
import RenamePattern from "./RenamePattern";
import DuplicatePattern from "./DuplicatePattern";

const PatternSelector = ({ patterns, setPatterns, colorByIndex, initLength, onSelect, selectedPatternID, setInstrumentList }) => {
  
  
  return (
    <div className="flex gap-4 p-2 absolute bottom-0 border-4 w-screen overflow-auto border-gray-700 scrollbar-custom">
      {patterns.map((pattern) => (
        <button
          key={pattern.id}
          onClick={() => onSelect(pattern.id)}
          className={`flex flex-col items-center justify-center w-15 h-15 rounded-full border-4 transition-all duration-150 ease-in-out ${
            selectedPatternID === pattern.id ? "border-white" : "border-transparent"
          } ${pattern.color}`}
          title={pattern.name}
        >
          {pattern.name}
        </button>
      ))}

      <AddPattern onSelect={onSelect} patterns={patterns} setPatterns={setPatterns} colorByIndex={colorByIndex} setInstrumentList={setInstrumentList}/>
      <DeleteAllPatterns patterns={patterns} setPatterns={setPatterns} setInstrumentList={setInstrumentList} selectedPatternID={selectedPatternID} onSelect={onSelect}/>
      <RenamePattern patterns={patterns} setPatterns={setPatterns} selectedPatternID={selectedPatternID}/>
      <DeletePattern patterns={patterns} setPatterns={setPatterns} selectedPatternID={selectedPatternID}/>
      <DuplicatePattern onSelect={onSelect} setPatterns={setPatterns} selectedPatternID={selectedPatternID} setInstrumentList={setInstrumentList}/>
      <ResetPattern patterns={patterns} setPatterns={setPatterns} colorByIndex={colorByIndex} initLength={initLength} onSelect={onSelect} setInstrumentList={setInstrumentList}/>
    </div>
  );
};

export default PatternSelector;