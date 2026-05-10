import { useEffect, useState, useCallback, useRef } from 'react';
import Card from "./card";
import home from "../../assets/HomeImage.png";
import jps from "../../assets/marker-pin-01.png";
import searsh from "../../assets/search.png";
import Filter from './filter';
import API from '../../api/axiosConfig';
import Nav from './UserNavbar';

const User_dashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeFilters, setActiveFilters] = useState({
    from: '',
    to: '',
    date: '',
    tripType: 'half',
    minPrice: 0,
    maxPrice: 150000,
    timeFilter: '',
    companyFilter: ''
  });
  
  const [searchInputs, setSearchInputs] = useState({
    from: '',
    to: '',
    date: '',
    tripType: 'half'
  });
  
  const [tempFilters, setTempFilters] = useState({
    minPrice: 0,
    maxPrice: 150000,
    timeFilter: '',
    companyFilter: ''
  });

  const [companies, setCompanies] = useState([]);

  const fetchTrips = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      console.log('Fetching trips with params:', filterParams);
      
      const response = await API.get('/user/dashboard', {
        params: filterParams
      });
      const tripsArr = response.data.trips || [];
      setTrips(tripsArr);

      // Extract unique companies from trips for the filter
      const comps = [];
      tripsArr.forEach(trip => {
        const c = trip.company;
        if (!c) return;
        const id = String(c.companyId || c._id || c.id || c.companyId || c.companyId);
        const name = c.companyName || c.name || '';
        const logo = c.logo || '';
        if (!comps.some(x => String(x._id) === id)) {
          comps.push({ _id: id, name, logo });
        }
      });
      setCompanies(comps);

      console.log('Trips fetched:', response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchFilters = {
      ...activeFilters,
      from: searchInputs.from,
      to: searchInputs.to,
      date: searchInputs.date,
      tripType: searchInputs.tripType
    };
    
    setActiveFilters(searchFilters);
    fetchTrips(searchFilters);
  };

  const handleTempFilterChange = useCallback((newFilters) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = useCallback(() => {
    const newFilters = {
      ...activeFilters,
      minPrice: tempFilters.minPrice,
      maxPrice: tempFilters.maxPrice,
      timeFilter: tempFilters.timeFilter,
      companyFilter: tempFilters.companyFilter
    };
    setActiveFilters(newFilters);
    fetchTrips(newFilters);
  }, [activeFilters, tempFilters, fetchTrips]);

  useEffect(() => {
    fetchTrips();
  }, []);

  if (loading) return <div className="text-center mt-20 font-Tajawal">جاري التحميل...</div>;

  return (
    <div className="font-Tajawal bg-gray-50 min-h-screen pb-10">
      {/* Navbar */}
      <Nav />
      
      {/* Hero Section */}
      <div className="relative flex flex-col mt-6 items-center">
        <img src={home} alt="Hero" className="w-[85%] md:w-[70%] rounded-b-[40px] shadow-sm" />
        
        {/* Search Bar Container */}
        <div className="z-10 -mt-12 bg-white w-[90%] lg:w-[75%] p-6 rounded-[30px] shadow-xl border border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap items-end justify-center gap-4">
            
            {/* Search Button */}
            <div className="w-full lg:w-auto min-w-[120px]">
              <button 
                type="submit" 
                className="w-full h-12 bg-[#3E92CC] text-white rounded-xl font-bold hover:bg-[#2E7AB3] transition"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>بحث</span>
                  <img src={searsh} className="w-4 h-4" alt="" />
                </div>
              </button>
            </div>

            {/* Inputs Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow w-full text-right" dir="rtl">
              <div className="relative">
                <label className="block text-sm mb-1 mr-2 text-gray-600">من</label>
                <img src={jps} className="absolute right-3 top-9 w-5 opacity-50" alt="" />
                <input 
                  type="text" 
                  name="from"
                  value={searchInputs.from}
                  onChange={handleInputChange}
                  className="w-full h-12 pr-10 pl-4 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all" 
                  placeholder="مدينة الانطلاق"
                />
              </div>

              <div className="relative">
                <label className="block text-sm mb-1 mr-2 text-gray-600">إلى</label>
                <img src={jps} className="absolute right-3 top-9 w-5 opacity-50" alt="" />
                <input 
                  type="text" 
                  name="to"
                  value={searchInputs.to}
                  onChange={handleInputChange}
                  className="w-full h-12 pr-10 pl-4 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition-all" 
                  placeholder="الوجهة"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 mr-2 text-gray-600">نوع الرحلة</label>
                <select 
                  name="tripType"
                  value={searchInputs.tripType}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 rounded-xl bg-gray-100 outline-none appearance-none cursor-pointer"
                >
                  <option value="half">ذهاب فقط</option>
                  <option value="full">ذهاب وعودة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 mr-2 text-gray-600">التاريخ</label>
                <input 
                  type="date" 
                  name="date"
                  value={searchInputs.date}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 rounded-xl bg-gray-100 outline-none"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto mt-16 px-4 flex flex-col lg:flex-row-reverse gap-8">
        
        {/* Right Side: Filter */}
        <aside className="w-full lg:w-1/4">
          <Filter 
            companies={companies}
            onFilterChange={handleTempFilterChange}
            onApplyFilters={applyFilters}
            initialMinPrice={activeFilters.minPrice}
            initialMaxPrice={activeFilters.maxPrice}
            initialTimeFilter={activeFilters.timeFilter}
            initialCompanyFilter={activeFilters.companyFilter}
          />
        </aside>

        {/* Left Side: Trip Cards */}
        <main className="w-full lg:w-3/4 flex flex-col -ml-60 mr-20 gap-6">
         
          
          {trips.length > 0 ? (
            trips.map((trip) => (
              <Card
                key={trip._id}
                id={trip._id}
                companyName={trip.company?.companyName}
                from={trip.origin}
                distenation={trip.destination}
                logo={trip.company?.logo}
                price={trip.price}
                arriveTime={new Date(trip.arrivalTime).toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
                goTime={new Date(trip.departureTime).toLocaleTimeString('ar-EG', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
                date={new Date(trip.departureTime).toISOString().split('T')[0]}
              />
            ))
          ) : (
            <div className="text-center p-20 bg-white rounded-3xl shadow-sm text-gray-400">
              <i className="fas fa-bus text-5xl mb-3 opacity-30"></i>
              <p>لا توجد رحلات مطابقة لخياراتك حالياً</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default User_dashboard;