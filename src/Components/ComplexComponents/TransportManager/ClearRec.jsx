import { FaTrash } from "react-icons/fa";
import { useHoverInfo } from "../../Contexts/HoverInfoContext";



export default function ClearRec(){
    const {createHoverProps} = useHoverInfo();



    return (
        <div className="flex flex-row gap-1">
            <button {...createHoverProps("Clear recorded sequence")} className="px-2 py-1 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out">
                 <FaTrash size={20} color="red"/>
            </button>
        </div>
    )
}