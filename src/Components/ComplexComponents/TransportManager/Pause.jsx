import { FaPause } from "react-icons/fa"
import { useHoverInfo } from "../../Contexts/HoverInfoContext";


export default function Pause() {
    const {createHoverProps} = useHoverInfo();


    return (
        <div {...createHoverProps("Pause")} className="flex flex-row gap-1">
            <button className="px-2 py-1 text-white bg-gray-600 hover:bg-gray-600 hover:scale-110 hover:shadow-lg hover:shadow-gray-300/80 transition-all duration-300 ease-in-out">
                <FaPause  color="red"/>
            </button>
        </div>
    )

}