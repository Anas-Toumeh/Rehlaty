import React, { useState, useEffect } from "react";
import icon from "./../../assets/icon.png";
import icon1 from "./../../assets/icon1.png";
import icon2 from "./../../assets/icon2.png";
import icon3 from "./../../assets/icon3.png";

const Filter = ({ 
  onFilterChange, 
  onApplyFilters,
  initialMinPrice = 0, 
  initialMaxPrice = 150000,
  initialTimeFilter = "",
  initialCompanyFilter = "",
  companies = []
}) => {
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [selectedTime, setSelectedTime] = useState(initialTimeFilter);
  const [selectedCompany, setSelectedCompany] = useState(initialCompanyFilter);

  // إرسال الفلاتر المؤقتة عند التغيير (للسعر فقط)
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        minPrice: minPrice,
        maxPrice: maxPrice,
        timeFilter: selectedTime,
        companyFilter: selectedCompany
      });
    }
  }, [minPrice, maxPrice, selectedTime, selectedCompany]);

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    if (value <= maxPrice) {
      setMinPrice(value);
    }
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= minPrice) {
      setMaxPrice(value);
    }
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const resetFilters = () => {
    setMinPrice(0);
    setMaxPrice(150000);
    setSelectedTime("");
    setSelectedCompany("");
    
    if (onFilterChange) {
      onFilterChange({
        minPrice: 0,
        maxPrice: 150000,
        timeFilter: "",
        companyFilter: ""
      });
    }
    
    setTimeout(() => {
      if (onApplyFilters) {
        onApplyFilters();
      }
    }, 100);
  };

  const timeSlots = [
    { id: "morning", label: " 5 صباحاً 10 - مساءً", icon: icon1, value: "morning" },
    { id: "early", label: "قبل 10 صباحاً", icon: icon, value: "early" },
    { id: "evening", label: "بعد 11 مساءً", icon: icon3, value: "evening" },
    { id: "night", label: "10 مساءً 2 - مساءً ", icon: icon2, value: "night" }
  ];


  return (
    <div className="rounded-2xl bg-white shadow-lg p-6 font-Tajawal border border-gray-100">
      <div className="border-b-2 border-gray-200 pb-4 mb-6">
        <h4 className="text-2xl font-bold text-right flex items-center gap-2">
          <i className="fas fa-sliders-h text-[#3E92CC]"></i>
          فلتر
        </h4>
      </div>

      {/* نطاق السعر */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-right mb-3">نطاق السعر</h4>
        <div className="flex justify-between mb-3">
          <p className="text-[#3E92CC] font-bold">{minPrice} ل.س</p>
          <p className="text-[#3E92CC] font-bold">{maxPrice} ل.س</p>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-500 text-right mb-1">الحد الأدنى</p>
          <input
            type="range"
            min={0}
            max={150000}
            value={minPrice}
            onChange={handleMinChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3E92CC]"
          />
        </div>
        
        <div>
          <p className="text-sm text-gray-500 text-right mb-1">الحد الأقصى</p>
          <input
            type="range"
            min={0}
            max={150000}
            value={maxPrice}
            onChange={handleMaxChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3E92CC]"
          />
        </div>
      </div>

      {/* وقت الرحلة */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-right mb-3">وقت الرحلة</h4>
        <div className="grid grid-cols-2 gap-3">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => setSelectedTime(selectedTime === slot.value ? "" : slot.value)}
              className={`text-center bg-gray-200 rounded-2xl py-4 cursor-pointer transition-all duration-200 hover:bg-[#3E92CC] hover:text-white ${
                selectedTime === slot.value ? 'bg-[#3E92CC] text-white' : 'text-gray-600'
              }`}
            >
              <img src={slot.icon} alt="" className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">{slot.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* الشركة */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-right mb-4">الشركة</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {companies && companies.length > 0 ? (
            companies.map((company) => {
              const compId = String(company._id || company.id || company.companyId || company.companyId);
              const compName = company.name || company.companyName || '';
              return (
                <label
                  key={compId}
                  className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                    selectedCompany === compId 
                      ? 'bg-blue-50 border-[#3E92CC] shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="company"
                    value={compId}
                    checked={selectedCompany === compId}
                    onChange={() => setSelectedCompany(selectedCompany === compId ? "" : compId)}
                    className="mt-1 flex-shrink-0 cursor-pointer w-5 h-5 accent-[#3E92CC]"
                  />
                  <span className="text-right text-base flex-1 mr-3 break-words line-clamp-2 font-medium text-gray-700">{compName}</span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 text-right py-2">لا توجد شركات</p>
          )}
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleApply}
          className="flex-1 bg-[#3E92CC] text-white py-3 rounded-xl font-bold hover:bg-[#2E7AB3] transition"
        >
          <i className="fas fa-check ml-2"></i>
          تطبيق الفلتر
        </button>
        <button
          onClick={resetFilters}
          className="flex-1 bg-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
        >
          <i className="fas fa-undo-alt ml-2"></i>
          إعادة تعيين
        </button>
      </div>
      
      <p className="text-xs text-gray-400 text-center mt-3">
        * اختر الفلاتر ثم اضغط "تطبيق الفلتر"
      </p>
    </div>
  );
};

export default Filter;