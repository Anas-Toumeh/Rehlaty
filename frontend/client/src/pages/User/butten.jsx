
import { Link } from "react-router-dom"
export default function Butten (props){

return(
    <Link to={props.to} >
<h1 className="w-full h-full flex-initial  bg-[#3E92CC] mx-5 rounded-lg place-self-center text-center place-content-center text-white font-tajawal">{props.text}</h1>
    </Link>
)
}