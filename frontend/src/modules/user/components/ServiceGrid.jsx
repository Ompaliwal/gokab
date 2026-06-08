import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';
import toast from 'react-hot-toast';

const ServiceTile = ({ icon, label, description, path, accentClass, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex w-full min-h-[112px] items-center justify-center">
        <div className="flex h-[100px] w-[90%] animate-pulse flex-col items-center justify-center gap-2 rounded-[16px] border border-white/20 bg-white/65 px-1 py-1.5">
        <div className="h-[72px] w-[72px] rounded-[16px] bg-gray-200" />
          <div className="h-3 w-12 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => path && navigate(path)}
      className="flex h-full min-h-[112px] w-full items-center justify-center transition-transform"
    >
      <div className="flex h-[108px] w-[92%] flex-col items-center justify-center gap-1.5 px-1 py-1">
        <div className={`flex h-[82px] w-[82px] items-center justify-center rounded-[18px] overflow-hidden ${accentClass || 'bg-gray-50'}`}>
          <img src={icon} alt={label} className="h-[70px] w-[70px] object-contain scale-[1.12] mix-blend-multiply drop-shadow-sm" />
        </div>

        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="min-h-[24px] text-[10.5px] font-bold leading-tight tracking-tight text-slate-900 line-clamp-2 uppercase">
            {label}
          </span>
          <span className="sr-only">{description}</span>
        </div>
      </div>
    </motion.button>
  );
};

const ServiceGrid = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const getServiceKey = (service, index) => {
    const label = String(service?.label || '').trim();
    const path = String(service?.path || '').trim();
    return label || path ? `${label || 'service'}-${path || index}` : `service-${index}`;
  };

  const getPath = (module) => {
    if (module.transport_type === 'delivery') return '/taxi/user/parcel/type';
    if (module.service_type === 'rental') return '/taxi/user/rental';
    if (module.service_type === 'outstation') return '/taxi/user/intercity';
    if (module.service_type === 'bus' || module.name.toLowerCase().includes('bus')) {
      return '/taxi/user/bus';
    }
    if (module.service_type === 'pooling' || module.name.toLowerCase().includes('pooling')) {
      return '/taxi/user/pooling';
    }
    
    // Default taxi paths based on name/keywords if needed, or just generic select-location
    if (module.name.toLowerCase().includes('cab') || module.name.toLowerCase().includes('taxi')) {
        return '/taxi/user/cab';
    }
    return '/taxi/user/ride/select-location';
  };

  const getAccent = (index) => {
    const accnets = [
      'bg-[linear-gradient(135deg,#F0FDF4_0%,#DCFCE7_100%)]', // Minty Green
      'bg-[linear-gradient(135deg,#ECFEFF_0%,#CFFAFE_100%)]', // Light Cyan
      'bg-[linear-gradient(135deg,#F0F9FF_0%,#E0F2FE_100%)]', // Sky Blue
      'bg-[linear-gradient(135deg,#EBFDF5_0%,#D1FAE5_100%)]', // Emerald Green
      'bg-[linear-gradient(135deg,#F4FBF7_0%,#D8F3E5_100%)]', // Subtle Teal
      'bg-[linear-gradient(135deg,#FEFCE8_0%,#FEF9C3_100%)]', // Soft Gold
    ];
    return accnets[index % accnets.length];
  };

  const { modules, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (settingsLoading) return;
    
    // Only show active modules
    const activeModules = (modules || []).filter(m => m.active);
    
    const mapped = activeModules.map((m, idx) => ({
      icon: normalizeAssetUrl(m.mobile_menu_icon),
      label: m.name,
      description: m.short_description,
      path: getPath(m),
      accentClass: getAccent(idx)
    }));
    
    setServices(mapped);
    setLoading(false);
  }, [modules, settingsLoading]);

  const optionCount = loading ? '...' : services.length;
  const optionLabel = services.length === 1 ? 'option' : 'options';

  return (
    <div className="px-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="py-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">Services</p>
            <h2 className="mt-1 text-[18px] font-bold tracking-tight text-primary">Choose your ride</h2>
            <p className="mt-0.5 text-[11px] font-bold text-slate-500">Tap to start quickly.</p>
          </div>
        </div>

        <div className="mt-4 grid auto-rows-fr grid-cols-3 gap-3 md:grid-cols-4">
          {loading ? (
             [...Array(4)].map((_, i) => <ServiceTile key={i} loading />)
          ) : (
            services.map((service, index) => (
              <ServiceTile key={getServiceKey(service, index)} {...service} />
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default ServiceGrid;
