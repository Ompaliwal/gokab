import React from 'react';
import { Filter, MoreVertical, Search, Loader2, ChevronRight, Menu, X, MapPin, Calendar, Clock, Car, CreditCard, Users, Briefcase as LuggageIcon, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/adminService';

const STATUS_STYLES = {
  CANCELLED: 'bg-orange-500 text-white',
  COMPLETED: 'bg-teal-500 text-white',
  UPCOMING: 'bg-amber-400 text-white',
  ONGOING: 'bg-blue-500 text-white',
  ACCEPTED: 'bg-emerald-500 text-white',
};

const PAYMENT_STYLES = {
  CASH: 'bg-orange-500 text-white',
  CARD: 'bg-red-500 text-white',
  WALLET: 'bg-teal-500 text-white',
};

const TAB_SET = ['All', 'Completed', 'Cancelled', 'Upcoming', 'On Trip'];

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeTab = (tab) => {
  if (tab === 'On Trip') return 'ongoing';
  return tab.toLowerCase();
};

const normalizeRow = (row = {}) => ({
  id: String(row._id || row.id || row.requestId || Math.random()),
  requestId: row.requestId || row.request_id || row.ride_request_id || '--',
  date: row.date || row.createdAt || row.created_at || row.trip_date || row.updatedAt,
  userName: row.userName || row.user_name || row.customer_name || row.user?.name || '--',
  driverName: row.driverName || row.driver_name || row.driver?.name || '--',
  transportType: row.transportType || row.transport_type || row.service_type || row.module || '--',
  tripStatus: String(row.tripStatus || row.trip_status || row.status || '').toUpperCase(),
  paymentOption: String(row.paymentOption || row.payment_option || row.payment_method || 'CASH').toUpperCase(),
  bookingPreferences: row.bookingPreferences || null,
  pickupLabel: row.pickupLabel || '--',
  dropLabel: row.dropLabel || '--',
  userPhone: row.user?.phone || '--',
  driverPhone: row.driver?.phone || '--',
});

const Trips = () => {
  const [activeTab, setActiveTab] = React.useState('All');
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [limit, setLimit] = React.useState(10);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminService.getRideRequests({
        limit,
        tab: normalizeTab(activeTab),
        search,
      });
      const payload = response?.data?.data || response?.data || response || {};
      const results = Array.isArray(payload?.results) ? payload.results : [];
      setRows(results.map(normalizeRow));
    } catch (err) {
      setRows([]);
      setError(err?.message || 'Failed to load trip requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab, limit, search]);

  React.useEffect(() => {
    loadRows();
  }, [loadRows]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-t-xl">
          <h1 className="text-[20px] font-black tracking-tight text-slate-800 uppercase">RIDE REQUESTS</h1>
          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400">
            <span>Operations</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-500">Ride Requests</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm relative">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-[14px] font-medium text-slate-500">
              <span>show</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 w-16 border border-slate-200 rounded-md bg-white px-2 text-[13px] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex flex-1 justify-center items-center gap-4 md:gap-8 flex-wrap">
              {TAB_SET.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-1 text-[15px] font-bold transition-all ${
                    activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="trip-tab" className="absolute -bottom-3 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search trips"
                  className="h-10 w-52 rounded-full border border-slate-200 bg-white pl-9 pr-4 text-[13px] outline-none focus:border-slate-300"
                />
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#f46b45] text-white rounded-lg text-[13px] font-bold shadow-sm">
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  {['Request Id', 'Date', 'User Name', 'Driver Name', 'Transport Type', 'Trip Status', 'Payment Option', 'Action'].map((heading) => (
                    <th key={heading} className="px-6 py-4 text-[13px] font-bold text-slate-900 border-b border-slate-100">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Loader2 className="animate-spin text-slate-300 mx-auto" size={32} />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-[14px] font-medium text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedRow(row)}
                    >
                      <td className="px-6 py-5 text-[14px] text-slate-600 font-medium">{row.requestId}</td>
                      <td className="px-6 py-5 text-[14px] text-slate-600 font-medium">{formatDate(row.date)}</td>
                      <td className="px-6 py-5 text-[14px] text-slate-600 font-medium">{row.userName}</td>
                      <td className="px-6 py-5 text-[14px] text-slate-600 font-medium">{row.driverName}</td>
                      <td className="px-6 py-5 text-[14px] text-slate-600 font-medium">{row.transportType}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded uppercase ${STATUS_STYLES[row.tripStatus] || 'bg-slate-200 text-slate-700'}`}>
                          {row.tripStatus || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded uppercase ${PAYMENT_STYLES[row.paymentOption] || 'bg-orange-500 text-white'}`}>
                          {row.paymentOption}
                        </span>
                      </td>
                      <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedRow(row)}
                          className="text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-[14px] font-medium text-slate-400">
                      No ride requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button className="fixed bottom-10 right-10 w-14 h-14 bg-[#00BFA5] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Details Drawer / Modal */}
      <AnimatePresence>
        {selectedRow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRow(null)}
              className="fixed inset-0 bg-black z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[101] flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-[#6FBF7A]/5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2F5F43]">Ride Request Details</span>
                  <h2 className="text-[20px] font-black text-slate-800 mt-1">{selectedRow.requestId}</h2>
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="w-10 h-10 rounded-full hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-4 md:p-6 space-y-8">
                {/* Routing & Locations */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">Route & Locations</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                    <div className="absolute left-[31px] top-[40px] bottom-[40px] w-[1.5px] border-l border-dashed border-slate-200" />
                    
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-[#6FBF7A]/10 border border-[#6FBF7A]/30 flex items-center justify-center shrink-0 mt-1">
                        <div className="w-2 h-2 bg-[#6FBF7A] rounded-full" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pickup</p>
                        <p className="text-[14px] font-bold text-slate-800 mt-0.5">{selectedRow.pickupLabel}</p>
                      </div>
                    </div>

                    <div className="h-6" />

                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mt-1">
                        <MapPin size={12} className="text-orange-500" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Drop</p>
                        <p className="text-[14px] font-bold text-slate-800 mt-0.5">{selectedRow.dropLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Info Grid */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">Ride Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                      <Calendar size={18} className="text-[#6FBF7A] mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Request Date</p>
                        <p className="text-[14px] font-black text-slate-800 mt-1">{formatDate(selectedRow.date)}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                      <Clock size={18} className="text-[#6FBF7A] mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Trip Type</p>
                        <p className="text-[14px] font-black text-slate-800 mt-1">{selectedRow.bookingPreferences?.tripType || 'ONE_WAY'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                      <Car size={18} className="text-[#6FBF7A] mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Vehicle Requested</p>
                        <p className="text-[14px] font-black text-slate-800 mt-1">{selectedRow.transportType || '--'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
                      <CreditCard size={18} className="text-[#6FBF7A] mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Fare & Payment</p>
                        <p className="text-[14px] font-black text-[#2F5F43] mt-1">Rs {Number(selectedRow.fare || 0).toLocaleString()} ({selectedRow.paymentOption})</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Preferences */}
                <div className="space-y-4">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">Advanced Preferences</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-500" />
                        <span className="text-[12px] font-bold text-slate-700">Passenger Count</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900">{selectedRow.bookingPreferences?.passengers || 1}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <LuggageIcon size={16} className="text-slate-500" />
                        <span className="text-[12px] font-bold text-slate-700">Luggage Carrying</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900">{selectedRow.bookingPreferences?.luggage ? 'Yes' : 'No'}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-500" />
                        <span className="text-[12px] font-bold text-slate-700">Pooling / Share Ride</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900">{selectedRow.bookingPreferences?.pooling ? 'Yes' : 'No'}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-slate-500" />
                        <span className="text-[12px] font-bold text-slate-700">Preferred Languages</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900">{selectedRow.bookingPreferences?.preferredLanguages?.join(', ') || 'Any'}</span>
                    </div>

                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-slate-500" />
                        <span className="text-[12px] font-bold text-slate-700">Driver Preferences</span>
                      </div>
                      <span className="text-[13px] font-black text-slate-900">{selectedRow.bookingPreferences?.driverPreferences?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* User & Driver Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">User Details</p>
                    <p className="text-[14px] font-bold text-slate-800 mt-1">{selectedRow.userName}</p>
                    <p className="text-[12px] text-slate-500 font-semibold mt-0.5">{selectedRow.userPhone}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Driver Details</p>
                    <p className="text-[14px] font-bold text-slate-800 mt-1">{selectedRow.driverName}</p>
                    <p className="text-[12px] text-slate-500 font-semibold mt-0.5">{selectedRow.driverPhone}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trips;
