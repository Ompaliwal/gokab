import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Clock, ChevronRight, AlertCircle, Plane } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';

const TERMINALS = ['T1', 'T2', 'T3'];

const unwrap = (response) => response?.data?.data || response?.data || response;
const normalizeId = (value) => String(value?._id || value?.id || value || '').trim();

const getVehicleTypes = (response) => {
  const data = unwrap(response);
  return data?.vehicle_types || data?.results || (Array.isArray(data) ? data : []);
};

const getSetPriceRows = (response) => {
  const data = unwrap(response);
  return (data?.paginator?.data || data?.results || []).filter((row) => {
    const scope = String(row?.pricing_scope || 'ride').trim().toLowerCase();
    return scope === 'ride';
  });
};

const isActiveAirportRule = (rule) => {
  const isActive = Number(rule?.active ?? 1) === 1 && String(rule?.status || 'active').toLowerCase() !== 'inactive';
  return isActive && Boolean(rule?.enable_airport_ride);
};

const getRuleServiceLocationId = (rule) => normalizeId(
  rule?.service_location_id?._id
  || rule?.service_location_id?.id
  || rule?.service_location_id
  || rule?.service_location?._id
  || rule?.service_location?.id
  || rule?.zone_id?.service_location_id?._id
  || rule?.zone_id?.service_location_id?.id
  || rule?.zone_id?.service_location_id
  || rule?.zone?.service_location_id?._id
  || rule?.zone?.service_location_id?.id
  || rule?.zone?.service_location_id
  || ''
);

const sortPricingRules = (rules = []) => (
  [...rules].sort((first, second) => {
    const firstUpdatedAt = new Date(first?.updatedAt || first?.createdAt || 0).getTime();
    const secondUpdatedAt = new Date(second?.updatedAt || second?.createdAt || 0).getTime();
    return secondUpdatedAt - firstUpdatedAt;
  })
);

const matchesTransportType = (rule, transportType) => {
  const normalizedRuleTransport = String(rule?.transport_type || 'taxi').trim().toLowerCase();
  const normalizedTransportType = String(transportType || 'taxi').trim().toLowerCase() || 'taxi';

  if (normalizedTransportType === 'both') {
    return normalizedRuleTransport === 'taxi' || normalizedRuleTransport === 'both';
  }

  return normalizedRuleTransport === normalizedTransportType || normalizedRuleTransport === 'both';
};

const findBestAirportPricingRule = ({ rules, vehicleTypeId, serviceLocationId, transportType }) => {
  const normalizedVehicleTypeId = normalizeId(vehicleTypeId);
  const normalizedServiceLocationId = normalizeId(serviceLocationId);
  const normalizedTransportType = String(transportType || 'taxi').trim().toLowerCase() || 'taxi';

  const candidates = sortPricingRules(rules.filter((rule) => {
    const matchesVehicle = normalizeId(rule?.vehicle_type?._id || rule?.vehicle_type || rule?.type_id) === normalizedVehicleTypeId;
    return matchesVehicle && isActiveAirportRule(rule) && matchesTransportType(rule, normalizedTransportType);
  }));

  if (!candidates.length) {
    return null;
  }

  const exactTransportMatch = (rule) => String(rule?.transport_type || 'taxi').trim().toLowerCase() === normalizedTransportType;

  const exactServiceLocation = candidates.find((rule) => (
    normalizedServiceLocationId
    && getRuleServiceLocationId(rule) === normalizedServiceLocationId
    && exactTransportMatch(rule)
  ));
  if (exactServiceLocation) return exactServiceLocation;

  const serviceLocationAnyTransport = candidates.find((rule) => (
    normalizedServiceLocationId && getRuleServiceLocationId(rule) === normalizedServiceLocationId
  ));
  if (serviceLocationAnyTransport) return serviceLocationAnyTransport;

  const genericTransportMatch = candidates.find((rule) => !getRuleServiceLocationId(rule) && exactTransportMatch(rule));
  if (genericTransportMatch) return genericTransportMatch;

  return candidates.find((rule) => !getRuleServiceLocationId(rule)) || candidates[0];
};

const getVehicleIcon = (type = {}) => {
  const customIcon = String(type?.image || type?.map_icon || type?.icon || '').trim();
  if (customIcon) return customIcon;

  const value = String(type?.icon_types || type?.name || '').toLowerCase();
  if (value.includes('bike')) return '/1_Bike.png';
  if (value.includes('auto')) return '/2_AutoRickshaw.png';
  if (value.includes('ehc')) return '/ehcv.png';
  if (value.includes('hcv')) return '/hcv.png';
  if (value.includes('lcv')) return '/LCV.png';
  if (value.includes('mcv')) return '/mcv.png';
  if (value.includes('truck')) return '/truck.png';
  if (value.includes('lux')) return '/Luxury.png';
  if (value.includes('premium')) return '/Premium.png';
  if (value.includes('suv')) return '/SUV.png';
  return '/4_Taxi.png';
};

const getVehicleLabel = (type) => type?.name || type?.vehicle_type || type?.label || 'Vehicle';

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const AirportCab = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';
  const serviceLocationId = routeState.serviceLocationId || routeState.service_location_id || '';

  const [pickup, setPickup] = useState(routeState.pickup || '');
  const [terminal, setTerminal] = useState(routeState.terminal || '');
  const [date, setDate] = useState(routeState.date || '');
  const [time, setTime] = useState(routeState.time || '');
  const [vehicle, setVehicle] = useState('');
  const [errors, setErrors] = useState({});
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingPricingRules, setIsLoadingPricingRules] = useState(true);
  const [vehicleError, setVehicleError] = useState('');

  useEffect(() => {
    let active = true;

    const loadVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        setVehicleError('');
        const response = await api.get('/users/vehicle-types');
        if (!active) return;

        const nextVehicles = getVehicleTypes(response).filter((type) => {
          const isActive = type.active !== false && Number(type.status ?? 1) !== 0;
          const transportType = String(type.transport_type || 'taxi').toLowerCase();
          return isActive && (transportType === 'taxi' || transportType === 'both');
        });

        setVehicleTypes(nextVehicles);
      } catch (error) {
        if (active) {
          setVehicleTypes([]);
          setVehicleError(error?.message || 'Could not load airport vehicles.');
        }
      } finally {
        if (active) {
          setIsLoadingVehicles(false);
        }
      }
    };

    loadVehicles();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPricingRules = async () => {
      try {
        setIsLoadingPricingRules(true);
        const response = await api.get('/admin/types/set-prices', {
          params: { scope: 'ride' },
        });
        if (!active) return;

        setPricingRules(getSetPriceRows(response));
      } catch {
        if (active) {
          setPricingRules([]);
        }
      } finally {
        if (active) {
          setIsLoadingPricingRules(false);
        }
      }
    };

    loadPricingRules();

    return () => {
      active = false;
    };
  }, []);

  const vehicles = useMemo(() => (
    vehicleTypes
      .map((type, index) => {
        const pricingRule = findBestAirportPricingRule({
          rules: pricingRules,
          vehicleTypeId: type?._id || type?.id,
          serviceLocationId,
          transportType: type?.transport_type || 'taxi',
        });

        if (!pricingRule) {
          return null;
        }

        return {
          id: String(type?._id || type?.id || type?.name || index),
          vehicleTypeId: String(type?._id || type?.id || ''),
          name: getVehicleLabel(type),
          icon: getVehicleIcon(type),
          fare: Math.max(
            0,
            Math.round(
              toFiniteNumber(pricingRule?.base_price, 0)
              + toFiniteNumber(pricingRule?.airport_surge, 0)
              + toFiniteNumber(pricingRule?.support_airport_fee, 0),
            ),
          ),
          desc: type?.short_description || type?.description || 'Airport transfer option',
          seats: Math.max(1, Number(type?.capacity || 4)),
          pricingRule,
        };
      })
      .filter(Boolean)
  ), [pricingRules, serviceLocationId, vehicleTypes]);

  useEffect(() => {
    if (!vehicle && vehicles.length) {
      setVehicle(vehicles[0].id);
      return;
    }

    if (vehicle && !vehicles.some((item) => item.id === vehicle)) {
      setVehicle(vehicles[0]?.id || '');
    }
  }, [vehicle, vehicles]);

  const selectedVehicle = vehicles.find((item) => item.id === vehicle) || vehicles[0] || null;

  const validate = () => {
    const nextErrors = {};
    if (!pickup.trim()) nextErrors.pickup = 'Pickup address is required';
    if (!terminal) nextErrors.terminal = 'Select a terminal';
    if (!date) nextErrors.date = 'Select travel date';
    if (!time) nextErrors.time = 'Select travel time';
    if (!selectedVehicle) nextErrors.vehicle = 'No airport vehicles are enabled right now';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBook = () => {
    if (!validate() || !selectedVehicle) return;

    navigate(`${routePrefix}/cab/airport-confirm`, {
      state: {
        isAirport: true,
        pickup,
        terminal,
        date,
        time,
        serviceLocationId,
        vehicle: selectedVehicle,
        fare: selectedVehicle.fare,
      },
    });
  };

  const isLoading = isLoadingVehicles || isLoadingPricingRules;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F3F4F6_38%,#EEF2F7_100%)] max-w-lg mx-auto font-sans pb-32 relative overflow-hidden">
      <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

      <header className="bg-white/90 backdrop-blur-md px-5 pt-10 pb-4 sticky top-0 z-20 border-b border-white/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[12px] border border-white/80 bg-white/90 flex items-center justify-center shadow-sm active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-slate-900" strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-slate-400">Auto & Cab</p>
            <h1 className="text-[19px] font-black tracking-tight text-slate-900">Airport Cab</h1>
          </div>
          <span className="text-[9px] font-black px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-100">Fixed Fare</span>
        </div>
      </header>

      <div className="mx-5 mt-4 rounded-[20px] overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-5 flex items-center gap-4 shadow-[0_8px_24px_rgba(37,99,235,0.25)]">
        <div className="flex-1">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">On-time transfers</p>
          <h2 className="text-[18px] font-black text-white leading-tight">Indore Airport<br />Cab Booking</h2>
          <p className="text-[11px] font-bold text-blue-200 mt-1">Fixed fares · No surge pricing</p>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-[18px] flex items-center justify-center">
          <Plane size={32} className="text-white" strokeWidth={1.5} />
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 ml-1 mb-1.5 block">Pickup Address</label>
          <div className={`flex items-center gap-3 rounded-[16px] px-4 py-3.5 border-2 transition-all ${errors.pickup ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white/90'}`}>
            <MapPin size={16} className="text-slate-400 shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={pickup}
              onChange={(event) => {
                setPickup(event.target.value);
                setErrors((current) => ({ ...current, pickup: '' }));
              }}
              placeholder="Your pickup location"
              className="flex-1 bg-transparent border-none text-[14px] font-bold text-slate-900 focus:outline-none placeholder:text-slate-300"
            />
          </div>
          {errors.pickup && <p className="text-[11px] font-black text-red-500 ml-1 mt-1 flex items-center gap-1"><AlertCircle size={11} strokeWidth={3} />{errors.pickup}</p>}
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 ml-1 mb-1.5 block">Terminal</label>
          <div className="flex gap-2">
            {TERMINALS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setTerminal(item);
                  setErrors((current) => ({ ...current, terminal: '' }));
                }}
                className={`flex-1 py-3 rounded-[14px] text-[13px] font-black uppercase tracking-widest border-2 transition-all ${
                  terminal === item ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white/90 text-slate-600 border-slate-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {errors.terminal && <p className="text-[11px] font-black text-red-500 ml-1 mt-1 flex items-center gap-1"><AlertCircle size={11} strokeWidth={3} />{errors.terminal}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 ml-1 mb-1.5 block flex items-center gap-1"><Calendar size={10} strokeWidth={3} /> Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => {
                setDate(event.target.value);
                setErrors((current) => ({ ...current, date: '' }));
              }}
              className={`w-full rounded-[14px] px-3 py-3 text-[13px] font-bold text-slate-900 border-2 focus:outline-none transition-all ${errors.date ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white/90'}`}
            />
            {errors.date && <p className="text-[10px] font-black text-red-500 ml-1 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 ml-1 mb-1.5 block flex items-center gap-1"><Clock size={10} strokeWidth={3} /> Time</label>
            <input
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                setErrors((current) => ({ ...current, time: '' }));
              }}
              className={`w-full rounded-[14px] px-3 py-3 text-[13px] font-bold text-slate-900 border-2 focus:outline-none transition-all ${errors.time ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white/90'}`}
            />
            {errors.time && <p className="text-[10px] font-black text-red-500 ml-1 mt-1">{errors.time}</p>}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400 mb-2">Choose Vehicle</p>
          {vehicleError ? (
            <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-bold text-red-600">
              {vehicleError}
            </div>
          ) : isLoading ? (
            <div className="rounded-[18px] border border-slate-100 bg-white/90 px-4 py-6 text-center text-[12px] font-bold text-slate-500">
              Loading airport vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/90 px-4 py-6 text-center">
              <p className="text-[13px] font-black text-slate-900">No airport vehicles available</p>
              <p className="mt-1 text-[11px] font-bold text-slate-500">Only vehicles with airport ride enabled in set price are shown here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setVehicle(item.id);
                    setErrors((current) => ({ ...current, vehicle: '' }));
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-[18px] border-2 transition-all text-left ${
                    vehicle === item.id ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white/90'
                  }`}
                >
                  <img src={item.icon} alt={item.name} className="h-11 w-11 object-contain shrink-0" draggable={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-black text-slate-900 truncate">{item.name}</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">Fixed Fare</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 truncate">{item.desc} · {item.seats} seats</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[17px] font-black text-slate-900">Rs {item.fare}</p>
                    <p className="text-[9px] font-bold text-slate-400">one way</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
          {errors.vehicle && <p className="text-[11px] font-black text-red-500 ml-1 mt-1 flex items-center gap-1"><AlertCircle size={11} strokeWidth={3} />{errors.vehicle}</p>}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-6 pt-3 bg-gradient-to-t from-[#EEF2F7] via-[#F3F4F6]/95 to-transparent pointer-events-none z-30">
        <div className="pointer-events-auto bg-white/90 rounded-[20px] border border-white/80 shadow-[0_4px_14px_rgba(15,23,42,0.06)] px-4 py-3 flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fixed Fare</p>
            <p className="text-[20px] font-black text-slate-900">{selectedVehicle ? `Rs ${selectedVehicle.fare}` : '--'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Vehicle</p>
            <p className="text-[13px] font-black text-slate-700">{selectedVehicle?.name || 'Unavailable'}</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBook}
          disabled={!selectedVehicle || isLoading}
          className="pointer-events-auto w-full bg-blue-600 py-4 rounded-[18px] text-[15px] font-black text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Book Airport Cab <ChevronRight size={17} strokeWidth={3} className="opacity-60" />
        </motion.button>
      </div>
    </div>
  );
};

export default AirportCab;
