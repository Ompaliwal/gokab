import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ArrowLeft,
  Flame,
  Gift,
  Loader2,
  Star,
  Trophy,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Wallet,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DriverBottomNav from '../../shared/components/DriverBottomNav';
import { claimDriverIncentiveReward, getCurrentDriver, getDriverIncentives } from '../services/registrationService';

const unwrap = (response) => response?.data?.data || response?.data || response || {};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const progressPercent = (current, target) => {
  const safeTarget = Math.max(1, Number(target || 0));
  const safeCurrent = Math.max(0, Number(current || 0));
  return Math.min(100, Math.round((safeCurrent / safeTarget) * 100));
};

const TIER_BENEFITS = [
  { name: 'Bronze', req: '0-49 trips', perk: '1.0x Streak Multiplier', desc: 'Standard support and default trip priority' },
  { name: 'Silver', req: '50-99 trips', perk: '1.05x Streak Multiplier + 2% Trip Bonus', desc: 'Priority support & minor trip earnings boost' },
  { name: 'Gold', req: '100-149 trips', perk: '1.10x Streak Multiplier + 5% Trip Bonus', desc: 'Elite driver tag, priority matching & 5% bonus earnings' },
  { name: 'Platinum', req: '150+ trips', perk: '1.20x Streak Multiplier + 8% Trip Bonus', desc: 'Instant cashouts, highest ride matching priority, & 8% bonus' }
];

const DriverIncentives = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingKey, setClaimingKey] = useState('');
  const [driverRating, setDriverRating] = useState(0);
  const [showTierBenefits, setShowTierBenefits] = useState(false);
  const [displayedBalance, setDisplayedBalance] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const canvasRef = useRef(null);
  const confettiCleanupRef = useRef(null);

  const fetchIncentives = async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const [incentiveResponse, driverResponse] = await Promise.all([
        getDriverIncentives(),
        getCurrentDriver(),
      ]);
      setData(unwrap(incentiveResponse));
      setDriverRating(Number(unwrap(driverResponse)?.rating || 0));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to load milestone progress');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
    return () => {
      if (confettiCleanupRef.current) confettiCleanupRef.current();
    };
  }, []);

  // Sync wallet balance to displayed rolling balance
  useEffect(() => {
    if (data?.walletBalance !== undefined) {
      if (displayedBalance === 0) {
        setDisplayedBalance(Number(data.walletBalance));
        return;
      }
      const start = displayedBalance;
      const end = Number(data.walletBalance);
      if (start === end) return;

      let current = start;
      const duration = 1200;
      const stepTime = 25;
      const steps = duration / stepTime;
      const increment = (end - start) / steps;

      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
          setDisplayedBalance(end);
          clearInterval(timer);
        } else {
          setDisplayedBalance(Math.round(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [data?.walletBalance]);

  // Canvas coin & confetti animation
  const triggerConfetti = () => {
    setShowConfetti(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (confettiCleanupRef.current) confettiCleanupRef.current();

    let particles = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10B981', '#FFD700', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899'];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.7,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 8,
        gravity: 0.45,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        alpha: 1,
        isCoin: Math.random() > 0.4,
      });
    }

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        active = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.008;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;

        if (p.isCoin) {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B'; // Gold
          ctx.fill();
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#FEF08A';
          ctx.fill();

          ctx.fillStyle = '#B45309';
          ctx.font = `bold ${p.radius * 0.9}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('₹', 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
        }
        ctx.restore();
      });

      if (active) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setShowConfetti(false);
      }
    };

    render();

    confettiCleanupRef.current = () => {
      cancelAnimationFrame(animationFrameId);
    };
  };

  const handleClaim = async (rewardType, rewardKey) => {
    setClaimingKey(`${rewardType}:${rewardKey}`);
    try {
      const response = await claimDriverIncentiveReward({ rewardType, rewardKey });
      const claimedReward = unwrap(response)?.claimedReward;
      toast.success(`${formatCurrency(claimedReward?.amount || 0)} added to your pocket!`);
      
      triggerConfetti();
      await fetchIncentives({ quiet: true });
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || requestError?.message || 'Unable to claim reward');
    } finally {
      setClaimingKey('');
    }
  };

  const summary = useMemo(() => data?.summary || {}, [data]);
  const milestones = useMemo(() => data?.milestones || [], [data]);
  const features = useMemo(() => data?.features || [], [data]);
  const claimedRewards = useMemo(() => data?.claimedRewards || [], [data]);
  const bonusEarnings = useMemo(
    () => claimedRewards.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
    [claimedRewards],
  );

  // Gamified Level Details
  const levelData = useMemo(() => {
    const totalTrips = Number(summary.totalTrips || summary.currentWeekTrips || 0);
    const level = Math.floor(totalTrips / 50) + 1;
    const currentXP = totalTrips % 50;
    const targetXP = 50;
    
    const levels = [
      { name: 'Bronze', color: '#B45309', gradient: 'from-amber-500 to-amber-700' },
      { name: 'Silver', color: '#64748B', gradient: 'from-slate-400 to-slate-600' },
      { name: 'Gold', color: '#D97706', gradient: 'from-yellow-500 via-amber-500 to-yellow-600' },
      { name: 'Platinum', color: '#4F46E5', gradient: 'from-purple-500 to-indigo-600' },
    ];
    
    const index = Math.min(level - 1, levels.length - 1);
    return {
      level,
      percent: (currentXP / targetXP) * 100,
      currentXP,
      targetXP,
      ...levels[index]
    };
  }, [summary]);

  // Greed Meter potential calculator
  const weeklyPool = useMemo(() => {
    const milestoneTotal = milestones.reduce((sum, m) => sum + Number(m.payout_amount || 0), 0);
    const featureTotal = features.reduce((sum, f) => sum + Number(f.reward_amount || 0), 0);
    return milestoneTotal + featureTotal;
  }, [milestones, features]);

  const remainingWeeklyPool = useMemo(() => {
    return Math.max(0, weeklyPool - bonusEarnings);
  }, [weeklyPool, bonusEarnings]);

  const poolProgressPercent = useMemo(() => {
    if (weeklyPool <= 0) return 0;
    return Math.min(100, Math.round((bonusEarnings / weeklyPool) * 100));
  }, [bonusEarnings, weeklyPool]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="relative flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
          <Trophy className="absolute text-emerald-600/80" size={16} />
        </div>
        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Performance Hub</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-36 relative overflow-x-hidden">
      {/* Background Soft Green Brand Gradients */}
      <div className="absolute top-[-5%] left-[-20%] w-[80%] h-[35%] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-20%] w-[80%] h-[35%] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Interactive Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
        style={{ display: showConfetti ? 'block' : 'none' }}
      />

      {/* Sleek Green/White Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 pt-10 pb-6 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/taxi/driver/profile')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-150 bg-white shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              aria-label="Back to account"
            >
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Performance Hub <Sparkles size={16} className="text-yellow-500 fill-yellow-500" />
              </h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">VIP Driver Program</p>
            </div>
          </div>
          <div className="text-right bg-emerald-50/80 border border-emerald-100/50 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.12)]">
            <div className="p-1.5 bg-emerald-500/10 rounded-xl">
              <Wallet size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-left">Pocket Balance</p>
              <p className="text-sm font-black text-emerald-600 font-mono tracking-tight">
                {formatCurrency(displayedBalance)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-8">
        
        {/* Weekly Greed Meter (Highlight Premium Money Gradient Box) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-premium">
          <div className="absolute top-0 right-0 p-3 bg-white/10 border-bl border-white/10 text-[10px] font-extrabold text-emerald-100 rounded-bl-2xl uppercase tracking-wider">
            Weekly Bonus Pool
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Rewards Left On The Table</p>
              <h2 className="text-3xl font-black tracking-tight text-white mt-1">
                {formatCurrency(remainingWeeklyPool)}
              </h2>
              <p className="text-xs text-emerald-50/90 mt-1 flex items-center gap-1">
                <TrendingUp size={14} className="text-white" /> 
                {remainingWeeklyPool > 0 
                  ? "Drive more to empty this pool and cash out!" 
                  : "Excellent! You have fully cleared the rewards pool!"}
              </p>
            </div>

            {/* Visual Neon Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-emerald-100">
                <span>Pool Claimed: {formatCurrency(bonusEarnings)}</span>
                <span>{poolProgressPercent}% Claimed</span>
              </div>
              <div className="h-3 w-full bg-emerald-950/40 border border-white/10 rounded-full overflow-hidden p-[2px]">
                <div 
                  className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-1000"
                  style={{ width: `${poolProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest block">Total Prize pool</span>
                <span className="text-sm font-bold text-white font-mono">{formatCurrency(weeklyPool)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest block">Claimed bonuses</span>
                <span className="text-sm font-bold text-white font-mono">{formatCurrency(bonusEarnings)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Level Overview & Perks */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${levelData.gradient} flex items-center justify-center shadow-md`}>
                <Trophy size={20} className="text-white fill-white/20" />
              </div>
              <div>
                <h2 className="text-md font-extrabold text-slate-900 flex items-center gap-1.5">
                  {levelData.name} Partner
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level {levelData.level}</p>
              </div>
            </div>
            <button
              onClick={() => setShowTierBenefits(!showTierBenefits)}
              className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-0.5"
            >
              Benefits {showTierBenefits ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-slate-500">Next Level Unlock</span>
              <span className="text-slate-700 font-mono">{levelData.currentXP} / {levelData.targetXP} trips</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
              <div 
                className={`h-full bg-gradient-to-r ${levelData.gradient} rounded-full transition-all duration-1000`} 
                style={{ width: `${levelData.percent}%` }}
              />
            </div>
          </div>

          {/* Collapsible Benefits Drawer */}
          <AnimatePresence>
            {showTierBenefits && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-6 pt-5 border-t border-slate-100"
              >
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Partner Benefits & Tiers</h3>
                <div className="space-y-3">
                  {TIER_BENEFITS.map((tier) => {
                    const isCurrent = levelData.name.toLowerCase() === tier.name.toLowerCase();
                    return (
                      <div 
                        key={tier.name} 
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrent 
                            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
                            : 'bg-slate-50/50 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {tier.name}
                            {isCurrent && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[8px] font-black uppercase">Active</span>}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{tier.req}</span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-600">{tier.perk}</p>
                        <p className="text-[10px] text-slate-555 mt-0.5">{tier.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 grid grid-cols-3 gap-2 pt-5 border-t border-slate-100 text-center">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-0.5">
                Streak <Flame size={12} className="text-orange-500" />
              </p>
              <p className="text-sm font-black text-slate-900 font-mono">{summary.streakDays || 0} Days</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weekly Trips</p>
              <p className="text-sm font-black text-slate-900 font-mono">{summary.currentWeekTrips || 0} Rides</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-0.5">
                Rating <Star size={12} className="text-yellow-500 fill-yellow-500" />
              </p>
              <p className="text-sm font-black text-slate-900 font-mono">{driverRating.toFixed(1)}</p>
            </div>
          </div>
        </section>

        {/* Milestone Roadmap */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest">Milestone Roadmap</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Consistency</span>
          </div>
          
          <div className="relative pl-6 ml-4 border-l-2 border-slate-150 space-y-8">
            {milestones.map((milestone, idx) => {
              const claimKey = `milestone:${milestone.id}`;
              const progress = progressPercent(milestone.progress?.qualifyingDays, milestone.progress?.targetDays);
              const canClaim = milestone.isEligible && !milestone.isClaimed;
              
              // Status Styling
              let nodeStyle = '';
              let nodeContent = null;
              
              if (milestone.isClaimed) {
                nodeStyle = 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
                nodeContent = <Check size={12} className="stroke-[3]" />;
              } else if (canClaim) {
                nodeStyle = 'border-amber-400 bg-amber-50 text-amber-600 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]';
                nodeContent = <Sparkles size={12} className="fill-amber-500/20" />;
              } else {
                nodeStyle = 'border-slate-200 bg-slate-50 text-slate-500';
                nodeContent = <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>;
              }

              return (
                <div key={milestone.id} className="relative">
                  
                  {/* Timeline Node */}
                  <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${nodeStyle}`}>
                    {nodeContent}
                  </div>

                  {/* Milestone Content Card */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className={`border rounded-2xl p-5 transition-all ${
                      canClaim 
                        ? 'border-amber-300 bg-gradient-to-br from-white to-amber-50/20 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.12)]' 
                        : milestone.isClaimed
                        ? 'border-slate-100 bg-slate-50/60 opacity-70 shadow-none'
                        : 'border-slate-100 bg-white shadow-soft'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                          {milestone.name}
                          {canClaim && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {milestone.required_weeks} weeks consistency challenge
                        </p>
                      </div>
                      <div className="text-right bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Payout</p>
                        <p className="text-xs font-black text-emerald-600 font-mono">
                          {formatCurrency(milestone.payout_amount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[9px] font-bold text-slate-500">
                        <span>Progress Tracker</span>
                        <span className="font-mono text-slate-700">
                          {milestone.progress?.qualifyingDays || 0}/{milestone.progress?.targetDays || 0} active days
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            milestone.isClaimed 
                              ? 'bg-emerald-500' 
                              : canClaim 
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                              : 'bg-emerald-600'
                          }`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>

                    <button
                      disabled={!canClaim || claimingKey === claimKey}
                      onClick={() => handleClaim('milestone', milestone.id)}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        canClaim 
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 hover:brightness-105' 
                          : milestone.isClaimed 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      {claimingKey === claimKey ? 'Processing...' : milestone.isClaimed ? 'Claimed ✓' : 'In Progress'}
                    </button>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Gamified Referral Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-emerald-50/40 to-white border border-emerald-100/50 rounded-3xl p-6 shadow-soft">
          <div className="absolute top-[-30%] right-[-10%] w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200/40 rounded-md text-[8px] font-black uppercase tracking-wider">
                Recruit Fleet
              </span>
              <h3 className="text-md font-black tracking-tight text-slate-900 mt-1.5">Invite Fleet Partners</h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Earn <span className="font-bold text-emerald-600 font-mono">{formatCurrency(data?.referralRewardAmount || 500)}</span> instantly for every qualified driver you refer.
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/taxi/driver/referral')}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5"
            >
              <Gift size={12} className="stroke-[3]" /> Invite Now
            </button>
          </div>
          
          <Gift className="absolute -right-6 -bottom-6 text-emerald-500/5 pointer-events-none rotate-12" size={130} />
        </section>

        {/* Boosters (Power-Ups) */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest">Active Power-Ups</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Daily Boosters</span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {features.filter(f => f.enabled).map((feature) => {
              const claimKey = `feature:${feature.key}`;
              const progress = progressPercent(feature.currentValue, feature.targetValue);
              const canClaim = feature.isEligible && !feature.isClaimed;

              // Power-up Icon resolver
              let powerUpIcon = <Zap size={16} />;
              let powerUpColor = 'text-emerald-600 bg-emerald-50 border-emerald-100/55';
              if (feature.key.includes('streak')) {
                powerUpIcon = <Flame size={16} />;
                powerUpColor = 'text-orange-600 bg-orange-50 border-orange-100/55';
              } else if (feature.key.includes('cancellation')) {
                powerUpIcon = <Shield size={16} />;
                powerUpColor = 'text-rose-600 bg-rose-50 border-rose-100/55';
              } else if (feature.key.includes('rating')) {
                powerUpIcon = <Star size={16} />;
                powerUpColor = 'text-yellow-600 bg-yellow-50 border-yellow-100/55';
              }

              return (
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  key={feature.key} 
                  className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all ${
                    canClaim 
                      ? 'border-emerald-250 bg-emerald-50/45 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]' 
                      : feature.isClaimed
                      ? 'border-slate-100 bg-slate-50/60 opacity-75 shadow-none'
                      : 'border-slate-100 bg-white shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${powerUpColor}`}>
                      {powerUpIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate tracking-tight">{feature.label}</h4>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-24 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden p-[1px] flex-shrink-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              feature.isClaimed ? 'bg-emerald-500' : 'bg-emerald-600'
                            }`} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-550 font-mono">
                          {feature.currentValue}/{feature.targetValue} {feature.unit || 'trips'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-xs font-black text-emerald-600 font-mono">
                      +{formatCurrency(feature.reward_amount)}
                    </p>
                    
                    <button
                      disabled={!canClaim || claimingKey === claimKey}
                      onClick={() => handleClaim('feature', feature.key)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        canClaim 
                          ? 'bg-emerald-600 text-white active:scale-95 cursor-pointer font-black hover:bg-emerald-750' 
                          : feature.isClaimed 
                          ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' 
                          : 'text-slate-400 bg-slate-50 border border-slate-100'
                      }`}
                    >
                      {claimingKey === claimKey ? '...' : feature.isClaimed ? 'Claimed' : 'Unlock'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <DriverBottomNav />
    </div>
  );
};

export default DriverIncentives;
