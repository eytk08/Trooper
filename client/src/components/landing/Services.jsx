import React, { useState, useEffect } from 'react';

export function Services() {
  const [services, setServices] = useState([]);

  // Fetch real database services (matching #services-container)
  useEffect(() => {
    fetch('/api/services')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setServices(data))
      .catch(() => {
        setServices([
          { name: 'Internal Medicine', description: 'General health, diagnostics, and outpatient consultations.' },
          { name: 'Dental Clinic', description: 'Oral healthcare, cleaning, and procedural treatments.' },
          { name: 'Ophthalmology', description: 'Comprehensive eye screening and visual care.' },
        ]);
      });
  }, []);

  return (
    <section id="services" className="py-20 bg-white border-t border-slate-200 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Services</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="services-container">
          {services.map((service, index) => (
            <div key={index} className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <h4 className="font-bold text-slate-900 text-base mb-1.5">{service.name || service.department}</h4>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{service.description || 'Specialized clinical care and outpatient services.'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}