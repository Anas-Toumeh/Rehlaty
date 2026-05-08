import React, { useState, useEffect } from "react";
import icon from "./../../assets/icon.png";
import icon1 from "./../../assets/icon1.png";
import icon2 from "./../../assets/icon2.png";
import icon3 from "./../../assets/icon3.png";

const Filter = ({ 
  onFilterChange, 
  onApplyFilters,
  initialMinPrice = 0, 
  initialMaxPrice = 75000,
  initialTimeFilter = "",
  initialCompanyFilter = ""
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
    setMaxPrice(75000);
    setSelectedTime("");
    setSelectedCompany("");
    
    // إرسال الفلاتر المعاد تعيينها
    if (onFilterChange) {
      onFilterChange({
        minPrice: 0,
        maxPrice: 75000,
        timeFilter: "",
        companyFilter: ""
      });
    }
    
    // تطبيق الفلاتر فوراً
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

  const companies = [
    { id: 1, name: "شركة القدموس للنقل و الشحن" },
    { id: 2, name: "شركة السريع" },
    { id: 3, name: "شركة الأمان" },
    { id: 4, name: "شركة الفاخرة" }
  ];

  return (
    <div className="rounded-2xl bg-gray-50 shadow-lg p-5 font-Tajawal">
      <div className="border-b-2 pb-3 mb-4">
        <h4 className="text-2xl font-bold text-right">فلتر</h4>
      </div>

      {/* نطاق السعر */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-right mb-3">نطاق السعر</h4>
        <div className="flex justify-between mb-3">
          <p className="text-[#3E92CC] font-bold">{minPrice} ر.س</p>
          <p className="text-[#3E92CC] font-bold">{maxPrice} ر.س</p>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-500 text-right mb-1">الحد الأدنى</p>
          <input
            type="range"
            min={0}
            max={75000}
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
            max={75000}
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
        <h4 className="text-xl font-bold text-right mb-3">الشركة</h4>
        <div className="space-y-2">
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(selectedCompany === company.name ? "" : company.name)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-200 ${
                selectedCompany === company.name ? 'bg-gray-200' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedCompany === company.name ? 'bg-[#3E92CC] border-[#3E92CC]' : 'border-gray-400'
              }`}></div>
              <p className="text-right text-lg">{company.name}</p>
            </div>
          ))}
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