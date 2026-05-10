
import Butten from "./butten";


export default function Card(props) {
  console.log(props.logo);
  

  return (
    <>
      <div className="w-11/12 h-40 rounded-3xl font-Tajawal
    border-gray-300 border-2  ml-[16.5%] mt-4 bg-white font-Tajawal flex flex-row-reverse mr-32">
        <div className="w-[200px] border-l-2 h-full place-self-end border-gray-400">
          <div className="h-full flex flex-col">
            
            <p className="text-gray-500 w-full text-center  h-1/3 place-content-center flex-initial">سعر التذكرة</p>
            <div className="flex">
              <h1 className="text-2xl place-self-center font-bold font-Tajawal ml-10 -mt-4">ل,س</h1>
              <h1 className="text-2xl place-self-center font-bold font-Tajawal ml-1 -mt-4 ">{props.price}</h1>
            </div>
            <div className="mt-6">
              
              <div className="w-[150px] h-[45px] place-self-center">
                <Butten to={`/cinformTrip/${props.id}`} text="احجز الان" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-[60%] grid grid-cols-3 grid-rows-3">
          <div className="place-content-center text-center text-gray-500">
            <p>{props.date}</p>
          </div>
          <div className=" col-span-2 text-right mr-4 place-content-center font-bold text-2xl">
            
            <h2 >{props.companyName}</h2>
          </div>
          <div className="row-span-2 flex flex-col place-content-top mt-4 text-center">
            <h2 className="h-1/3 text-2xl font-bold text-[#1A5276]">
              {props.distenation}
            </h2>
            <p className="mt-2 text-lg text-gray-500">{props.arriveTime}</p>
          </div>
          <div className="row-span-2 "></div>
          <div className="row-span-2 mr-4 flex flex-col place-content-top mt-4 text-center">
            <h2 className="h-1/3 text-2xl font-bold text-[#1A5276]">
              {props.from}
            </h2>
            <p className="mt-2 text-lg text-gray-500">{props.goTime}</p>
          </div>
        </div>
        <img src={`http://localhost:5000${props.logo}`} alt="" className="place-content-center w-[180px] mx-2 my-2"></img>
      </div>
    </>
  );
}
