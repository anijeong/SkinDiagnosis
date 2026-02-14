import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, ChevronRight, RefreshCcw, Shield, Activity, Droplet, Sun, Moon, Sparkles, Upload, AlertTriangle, ScanLine, Eye, Thermometer, Maximize, Grid, Focus, Aperture, Layers, Info, Menu, X, FileText, Crown, Stethoscope, History, Calendar, Star, Pill } from 'lucide-react';

// --- Constants & Configs ---

const METRICS_CONFIG = {
  hydration: { label: "수분", subLabel: "Hydration", weight: 0.18, color: "#3B82F6", desc: "피부 각질층의 수분 함유량입니다. 낮으면 건조함과 잔주름의 원인이 됩니다." },
  barrier: { label: "장벽·민감", subLabel: "Barrier", weight: 0.17, color: "#10B981", desc: "외부 자극에 대한 피부의 방어력입니다. 점수가 낮으면 쉽게 붉어지거나 따가움을 느낍니다." },
  texture: { label: "결·탄력", subLabel: "Texture", weight: 0.15, color: "#8B5CF6", desc: "피부 표면의 매끄러움과 진피층의 탄성입니다. 노화 진행도를 판단하는 척도입니다." },
  pigment: { label: "톤·색소", subLabel: "Pigment", weight: 0.13, color: "#F59E0B", desc: "멜라닌 색소의 침착 정도와 피부 톤의 균일성입니다. 기미, 주근깨 등을 분석합니다." },
  redness: { label: "홍조·염증", subLabel: "Redness", weight: 0.13, color: "#EF4444", desc: "혈관 확장 및 염증 반응의 정도입니다. 민감성 피부나 여드름성 피부에서 높게 나타납니다." },
  sebum: { label: "피지 밸런스", subLabel: "Sebum", weight: 0.12, color: "#F97316", desc: "피지 분비량의 적절성입니다. 과다하면 트러블, 부족하면 건조함을 유발합니다." },
  pores: { label: "모공 탄탄", subLabel: "Pores", weight: 0.12, color: "#6366F1", desc: "모공의 크기와 늘어짐 정도입니다. 탄력 저하와 피지 과다 분비의 영향을 받습니다." },
};

const QUESTIONS = [
  {
    id: 1,
    category: "risk",
    text: "최근 3개월 내 점이나 잡티의 변화가 있었나요?",
    subText: "ABCDE 규칙 (비대칭, 경계, 색, 크기, 변화) 체크",
    options: [
      { text: "변화 없음 (안전)", type: "low_risk" },
      { text: "약간 진해지거나 커짐", type: "medium_risk" },
      { text: "모양/색이 불규칙하게 변함/출혈", type: "high_risk" }
    ]
  },
  {
    id: 2,
    category: "symptom",
    text: "특정 부위의 불편감이 반복되나요?",
    subText: "염증, 감염, 장벽 손상 여부 확인",
    options: [
      { text: "없음", type: "clean" },
      { text: "가끔 가렵거나 붉어짐", type: "sensitive" },
      { text: "진물, 통증, 심한 붉음", type: "inflammation" }
    ]
  },
  {
    id: 3,
    category: "type",
    text: "세안 2시간 후 피부 상태는 어떤가요?",
    subText: "기초 유수분 밸런스(Skin Type) 확인",
    options: [
      { text: "전체적으로 당김 (건성)", type: "dry" },
      { text: "T존만 번들거림 (복합성)", type: "combination" },
      { text: "전체적으로 번들거림 (지성)", type: "oily" }
    ]
  }
];

// --- Helper Functions: Recommendations Engine ---

/**
 * 7가지 지표의 점수 조합에 따라 과학적 근거에 기반한 최적의 솔루션을 도출합니다.
 * @param {Object} scores - 각 지표별 점수 (0-100)
 * @param {string} riskLevel - 트리아지 위험도
 * @returns {Array} 추천 사항 리스트 [{ type: 'urgent'|'routine'|'tip', title: string, desc: string }]
 */
const getSmartRecommendations = (scores, riskLevel) => {
  const recommendations = [];

  // 1. 점수 정렬 (가장 낮은 점수가 가장 시급한 문제)
  const sortedMetrics = Object.entries(scores)
    .sort(([, scoreA], [, scoreB]) => scoreA - scoreB);
  
  const [worstMetric, worstScore] = sortedMetrics[0];
  const [secondMetric, secondScore] = sortedMetrics[1];

  // 2. 위험 신호 우선 처리 (Medical Triage)
  if (riskLevel === 'warning') {
    recommendations.push({
      type: 'critical',
      title: '피부과 전문의 진료 필수',
      desc: '불규칙한 색소 침착이나 염증 소견이 보입니다. 자가 케어보다는 전문의의 더모스코피 진단이 선행되어야 합니다.'
    });
  }

  // 3. 복합 문제 분석 (Combination Logic)
  // 가장 낮은 두 지표의 상호작용을 분석하여 시나리오 매칭
  
  // Case A: 장벽 손상 + 홍조 (민감성 쇼크)
  if (scores.barrier < 60 && scores.redness < 60) {
    recommendations.push({
      type: 'urgent',
      title: 'SOS 민감 진정 케어',
      desc: '피부 보호막이 무너져 염증 반응이 활발합니다. 기능성 제품(레티놀, 비타민C, AHA) 사용을 즉각 중단하고, "판테놀"과 "마데카소사이드" 위주의 재생 크림만 사용하세요.'
    });
  }
  // Case B: 수분 부족 + 장벽 손상 (건조성 피부염 위험)
  else if (scores.hydration < 60 && scores.barrier < 60) {
    recommendations.push({
      type: 'urgent',
      title: '지질막(Lamellar) 재건 필요',
      desc: '단순 수분 공급으로는 해결되지 않습니다. 세라마이드, 콜레스테롤, 지방산이 3:1:1로 배합된 고보습제로 피부 장벽부터 복구해야 수분이 유지됩니다.'
    });
  }
  // Case C: 피지 과다 + 모공 확장 (지성/트러블)
  else if (scores.sebum < 60 && scores.pores < 60) {
    recommendations.push({
      type: 'care',
      title: '피지 조절 및 모공 타이트닝',
      desc: '과잉 피지가 모공을 넓히고 있습니다. "나이아신아마이드(피지 조절)" 앰플과 주 2회 "BHA(살리실산)" 사용으로 모공 속 노폐물을 정돈하세요.'
    });
  }
  // Case D: 결/탄력 저하 + 모공 확장 (탄력 저하형 모공)
  else if (scores.texture < 60 && scores.pores < 60) {
    recommendations.push({
      type: 'care',
      title: '안티에이징 탄력 리프팅',
      desc: '모공이 세로로 늘어지는 것은 탄력 저하 신호입니다. 콜라겐 생성을 돕는 "펩타이드" 세럼이나 저자극 "레티날" 제품을 나이트 케어에 추가하세요.'
    });
  }
  // Case E: 색소 침착 + 결 거칠음 (광노화)
  else if (scores.pigment < 65 && scores.texture < 65) {
    recommendations.push({
      type: 'care',
      title: '광노화(Photo-aging) 집중 케어',
      desc: '자외선 데미지가 누적되어 있습니다. 아침엔 "비타민 C(순수)" 항산화제, 외출 시 SPF 50+ 자외선 차단제를 필수로 사용해 멜라닌을 억제하세요.'
    });
  }
  // Case F: 수분 부족 + 피지 과다 (수부지)
  else if (scores.hydration < 60 && scores.sebum < 60) {
    recommendations.push({
      type: 'care',
      title: '수분 부족형 지성(수부지) 밸런싱',
      desc: '속은 건조하고 겉은 번들거립니다. 오일 프리 수분 젤 크림을 사용하고, 알칼리성 클렌저 대신 "약산성 폼"으로 세안하여 유수분 밸런스를 맞추세요.'
    });
  }
  // Fallback: 단일 최하점 지표에 대한 솔루션
  else {
    const fallbackMap = {
      hydration: { title: '심층 보습 요망', desc: '저분자 히알루론산 토너를 3번 레이어링하는 "3스킨법"을 시도해보세요.' },
      barrier: { title: '장벽 강화 집중', desc: '세안 직후 3분 이내에 보습제를 발라 경피 수분 손실(TEWL)을 막으세요.' },
      texture: { title: '피부결 정돈', desc: '주 1회 마일드한 효소 세안제로 묵은 각질을 정리하여 턴오버 주기를 정상화하세요.' },
      pigment: { title: '미백 케어', desc: '멜라닌 생성을 막는 트라넥삼산이나 알부틴 성분이 함유된 세럼을 국소 부위에 덧바르세요.' },
      redness: { title: '쿨링 진정', desc: '피부 온도를 낮추는 알로에 베라 겔을 사용하고, 사우나나 격한 운동 직후엔 쿨링 팩을 권장합니다.' },
      sebum: { title: '오일 컨트롤', desc: '기름종이 사용을 줄이고, 피지 흡착 파우더가 든 토너를 T존 위주로 사용하세요.' },
      pores: { title: '모공 청정', desc: '클렌징 오일로 블랙헤드를 부드럽게 녹여내고, 찬물 패팅으로 마무리하세요.' },
    };
    recommendations.push({
      type: 'urgent',
      ...fallbackMap[worstMetric]
    });
  }

  // 4. 서브 추천 (Second Worst Metric 기반)
  if (recommendations.length < 2 && secondScore < 70) {
     const subMap = {
        hydration: '수분 섭취를 하루 2L 이상으로 늘리세요.',
        barrier: '뜨거운 물 세안은 장벽을 녹이니 미온수를 사용하세요.',
        texture: '베개 커버를 실크 소재로 바꾸면 수면 주름 예방에 좋습니다.',
        pigment: '실내에서도 자외선 차단제를 바르는 습관이 중요합니다.',
        redness: '자극적인 스크럽제 사용을 절대 금지합니다.',
        sebum: '유제품과 당류 섭취를 줄이면 피지 분비 감소에 도움이 됩니다.',
        pores: '프라이머 사용 후에는 반드시 이중 세안을 꼼꼼히 하세요.',
     };
     recommendations.push({
        type: 'tip',
        title: '생활 습관 교정',
        desc: subMap[secondMetric]
     });
  }

  return recommendations;
};

// --- Components ---

// 1. Radar Chart Component (SVG)
const RadarChart = ({ data, size = 300 }) => {
  const center = size / 2;
  const radius = (size / 2) - 40; // Padding
  const keys = Object.keys(METRICS_CONFIG);
  const total = keys.length;
  const angleSlice = (Math.PI * 2) / total;

  // Helper to get coordinates
  const getCoords = (value, index) => {
    const angle = index * angleSlice - Math.PI / 2; // Start from top
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Build Polygon Points
  const points = keys.map((key, i) => {
    const coords = getCoords(data[key], i);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  // Grid Levels (20, 40, 60, 80, 100)
  const levels = [20, 40, 60, 80, 100];

  return (
    <div className="relative flex justify-center items-center py-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grids */}
        {levels.map((level, i) => {
          const levelPoints = keys.map((_, idx) => {
            const coords = getCoords(level, idx);
            return `${coords.x},${coords.y}`;
          }).join(' ');
          return (
            <polygon 
              key={i} 
              points={levelPoints} 
              fill="none" 
              stroke="#E2E8F0" 
              strokeWidth="1" 
              strokeDasharray={i === 4 ? "0" : "4 4"}
            />
          );
        })}

        {/* Axes Lines & Labels */}
        {keys.map((key, i) => {
          const outer = getCoords(100, i);
          const labelCoords = getCoords(115, i); // Slightly outside
          return (
            <g key={key}>
              <line x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="#E2E8F0" strokeWidth="1" />
              <text 
                x={labelCoords.x} 
                y={labelCoords.y} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-[10px] font-bold fill-slate-500 uppercase tracking-tighter"
              >
                {METRICS_CONFIG[key].subLabel}
              </text>
            </g>
          );
        })}

        {/* Data Polygon */}
        <polygon points={points} fill="rgba(244, 63, 94, 0.2)" stroke="#F43F5E" strokeWidth="2" />
        
        {/* Data Points */}
        {keys.map((key, i) => {
          const coords = getCoords(data[key], i);
          return (
            <circle 
              key={i} 
              cx={coords.x} 
              cy={coords.y} 
              r="4" 
              fill="#F43F5E" 
              stroke="white" 
              strokeWidth="2" 
            />
          );
        })}
      </svg>
    </div>
  );
};

// 2. Camera View & Quality Gate Component
const SmartCamera = ({ onCapture, currentView }) => {
  const [qualityStatus, setQualityStatus] = useState({ focus: false, light: false, pose: false });
  const [isScanning, setIsScanning] = useState(true);
  const [message, setMessage] = useState("얼굴을 가이드 중앙에 맞춰주세요");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate Quality Gate Checks
    let timer;
    if (isScanning) {
      setProgress(0);
      setQualityStatus({ focus: false, light: false, pose: false });
      
      const sequence = async () => {
        setMessage("조명 상태 확인 중...");
        await new Promise(r => setTimeout(r, 800));
        setQualityStatus(p => ({ ...p, light: true }));
        
        setMessage("초점 및 거리 조정 중...");
        await new Promise(r => setTimeout(r, 800));
        setQualityStatus(p => ({ ...p, focus: true }));
        
        setMessage("얼굴 각도(Pose) 정렬 중...");
        await new Promise(r => setTimeout(r, 800));
        setQualityStatus(p => ({ ...p, pose: true }));

        setMessage("촬영 준비 완료");
        setIsScanning(false);
      };
      sequence();
    }
    return () => clearTimeout(timer);
  }, [currentView]);

  return (
    <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl group">
       {/* Fake Camera Feed Background */}
       <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <div className="text-slate-500 animate-pulse flex flex-col items-center">
            <Camera className="w-12 h-12 mb-2" />
            <span className="text-xs">Camera Preview Mockup</span>
          </div>
       </div>

       {/* --- Overlay UI --- */}
       
       {/* 1. Face Silhouette Guide */}
       <div className={`absolute inset-0 border-2 transition-colors duration-300 ${isScanning ? 'border-yellow-400/50' : 'border-green-400/80'} m-8 rounded-[45%] pointer-events-none`}>
         {/* Crosshair */}
         <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20"></div>
         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>
       </div>

       {/* 2. Yaw/Pitch Indicators (Top Right) */}
       <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${qualityStatus.pose ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[10px] text-white font-mono">
            {currentView === 'front' ? 'Y:0° P:0°' : (currentView === 'left' ? 'Y:-35°' : 'Y:+35°')}
          </span>
       </div>

       {/* 3. Distance Ring (Center) */}
       <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 rounded-[40%] transition-all duration-500 ${isScanning ? 'scale-110 opacity-50 border-white' : 'scale-100 opacity-100 border-green-400'}`}>
       </div>

       {/* 4. Status Message & Scan Line */}
       <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-2">
          {isScanning && (
             <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 animate-progress"></div>
             </div>
          )}
          <div className="bg-black/60 px-4 py-2 rounded-lg backdrop-blur text-white text-xs font-medium flex items-center gap-2">
            {isScanning ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-green-400" />}
            {message}
          </div>
       </div>

       {/* 5. Shutter Button */}
       <button 
         onClick={onCapture}
         disabled={isScanning}
         className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all ${isScanning ? 'opacity-50 scale-90' : 'opacity-100 scale-100 hover:scale-105 active:scale-95'}`}
       >
         <div className={`w-14 h-14 rounded-full ${isScanning ? 'bg-slate-500' : 'bg-white'}`}></div>
       </button>
    </div>
  );
};

// 3. Analysis Animation
const AnalysisLoading = ({ onComplete }) => {
    const steps = [
        "이미지 품질 검사 (Focus, WB, Exposure)...",
        "위험 신호 (ABCDE) 트리아지 분석...",
        "T존/U존 피지 분포 매핑...",
        "미세 주름 및 모공 깊이 측정...",
        "7축 피부 건강 지수(SHI) 계산 중..."
    ];
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length) {
            const timeout = setTimeout(() => setCurrentStep(c => c + 1), 800);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(onComplete, 500);
            return () => clearTimeout(timeout);
        }
    }, [currentStep, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950"></div>
            
            <div className="relative z-10 w-full max-w-sm">
                <div className="flex justify-center mb-10">
                    <div className="relative">
                        <ScanLine className="w-20 h-20 text-rose-500 animate-pulse" />
                        <div className="absolute inset-0 border-t-2 border-rose-500 animate-[scan_1.5s_ease-in-out_infinite] shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, idx) => (
                        <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${idx <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                            <div className={`w-2 h-2 rounded-full ${idx < currentStep ? 'bg-green-500' : (idx === currentStep ? 'bg-rose-500 animate-ping' : 'bg-slate-700')}`}></div>
                            <span className={`text-sm ${idx === currentStep ? 'text-white font-bold' : 'text-slate-400'}`}>{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 4. Menu & Info Page Component
const MenuPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('metrics'); // metrics, guide, premium, services

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-slide-up overflow-hidden">
      {/* Menu Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-900">SkinGuard 정보 센터</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('metrics')} 
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'metrics' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
        >
          지표 백과
        </button>
        <button 
          onClick={() => setActiveTab('guide')} 
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'guide' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
        >
          진단 가이드
        </button>
        <button 
          onClick={() => setActiveTab('premium')} 
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${activeTab === 'premium' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Crown className="w-4 h-4" /> 멤버십
        </button>
        <button 
          onClick={() => setActiveTab('services')} 
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${activeTab === 'services' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-800'}`}
        >
          전문가 서비스
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-10 bg-slate-50">
        
        {/* Tab: Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl mb-4 text-sm text-blue-700 leading-relaxed border border-blue-100">
              <Info className="w-4 h-4 inline-block mr-1 mb-0.5" /> 
              SkinGuard AI가 분석하는 7가지 핵심 지표의 상세 의미입니다. 점수가 높을수록(100점에 가까울수록) 건강한 상태를 의미합니다.
            </div>
            {Object.entries(METRICS_CONFIG).map(([key, config]) => (
              <div key={key} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: config.color }}>
                    {config.subLabel[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{config.label}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{config.subLabel}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pl-10 border-l-2 border-slate-100">
                  {config.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Focus className="w-5 h-5 text-rose-500" /> 정확한 진단을 위한 꿀팁
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="bg-slate-100 text-slate-600 font-bold w-6 h-6 rounded flex items-center justify-center shrink-0">1</span>
                  <div className="text-sm text-slate-600">
                    <strong>세안 30분 후 촬영:</strong> 세안 직후에는 수분이 일시적으로 높게 측정될 수 있습니다. 본연의 피부 상태를 위해 물기가 마른 후 촬영하세요.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-slate-100 text-slate-600 font-bold w-6 h-6 rounded flex items-center justify-center shrink-0">2</span>
                  <div className="text-sm text-slate-600">
                    <strong>자연광 활용:</strong> 형광등 아래보다는 창가 자연광이 가장 색상을 정확하게 표현합니다. 직사광선은 피하세요.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-slate-100 text-slate-600 font-bold w-6 h-6 rounded flex items-center justify-center shrink-0">3</span>
                  <div className="text-sm text-slate-600">
                    <strong>머리카락 넘기기:</strong> 이마와 턱 라인이 가려지면 AI가 면적을 인식하지 못해 분석 정확도가 떨어집니다.
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-800 text-white p-5 rounded-2xl">
              <h4 className="font-bold mb-2 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" /> 3-View 촬영의 중요성
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                정면 사진만으로는 코와 볼의 굴곡진 부분(나비존)의 모공을 정확히 보기 어렵습니다. 측면 사진을 함께 분석하면 진단 정확도가 20% 이상 향상됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Tab: Premium */}
        {activeTab === 'premium' && (
          <div className="space-y-5">
            <div className="text-center py-4">
              <h3 className="text-xl font-bold text-slate-900">SkinGuard Pro+</h3>
              <p className="text-sm text-slate-500">피부 건강, 전문가처럼 관리하세요</p>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-orange-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-white/10 w-32 h-32 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">BEST CHOICE</span>
                    <div className="text-3xl font-bold mt-2">₩4,900<span className="text-sm font-medium opacity-80">/월</span></div>
                  </div>
                  <Crown className="w-12 h-12 text-yellow-300 opacity-80" />
                </div>
                <ul className="space-y-3 text-sm font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 무제한 정밀 진단 & 히스토리 저장</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 월간 피부 변화 트렌드 리포트</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 초고해상도 클라우드 원본 백업</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 제휴 피부과 예약 우선권</li>
                </ul>
                <button className="w-full bg-white text-rose-600 font-bold py-3 rounded-xl mt-6 hover:bg-rose-50 transition-colors">
                  14일 무료 체험 시작하기
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-start gap-4">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-bold text-slate-800">주기적 진단 알림</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    피부 턴오버 주기(28일)에 맞춰 정기 진단 알림을 보내드립니다. 변화를 놓치지 마세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Services */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-500 text-center mb-2">
              * 구독 회원 전용 프리미엄 서비스입니다.
            </div>

            <button className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-300 transition-all text-left flex items-center gap-4 group">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <Stethoscope className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">1:1 전문의 원격 상담</h4>
                <p className="text-xs text-slate-500 mt-1">AI 리포트를 기반으로 피부과 전문의에게 화상으로 직접 상담받으세요.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500" />
            </button>

            <button className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-300 transition-all text-left flex items-center gap-4 group">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">심층 성분 분석 리포트</h4>
                <p className="text-xs text-slate-500 mt-1">사용 중인 화장품 사진을 올리면 내 피부 타입과의 궁합(성분)을 분석해드립니다.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
            </button>

            <button className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-300 transition-all text-left flex items-center gap-4 group">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">맞춤 시술 추천 & 할인</h4>
                <p className="text-xs text-slate-500 mt-1">리쥬란, 써마지 등 내 상태에 딱 필요한 시술을 추천받고 제휴 병원 할인을 받으세요.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState('landing'); // landing, quiz, guide, camera, analyzing, result
  const [answers, setAnswers] = useState({});
  const [images, setImages] = useState({ front: null, left: null, right: null, closeup: null });
  const [currentView, setCurrentView] = useState('front'); // front, left, right, closeup
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Menu State
  const fileInputRef = useRef(null);

  // --- Handlers ---
  const handleStart = () => setStep('quiz');

  const handleQuizAnswer = (type) => {
    setAnswers({ ...answers, [QUESTIONS[currentQIdx].id]: type });
    if (currentQIdx < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQIdx(p => p + 1), 250);
    } else {
      setTimeout(() => setStep('guide'), 250);
    }
  };

  const handleCapture = (imageData) => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [currentView]: reader.result }));
        if (currentView === 'front') {
             if (confirm("정밀 진단을 위해 측면 사진도 촬영하시겠습니까?\n(취소 시 바로 분석)")) {
                 setCurrentView('left');
             } else {
                 setStep('analyzing');
             }
        } else if (currentView === 'left') {
            setCurrentView('right');
        } else if (currentView === 'right') {
             setStep('analyzing');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Analysis Logic (The "Brain") ---
  const calculateResult = () => {
    const baseScores = {
        hydration: 65, barrier: 70, sebum: 60, pores: 65, pigment: 75, redness: 80, texture: 70
    };

    if (answers[3] === 'dry') { baseScores.hydration -= 20; baseScores.barrier -= 10; baseScores.texture -= 10; }
    if (answers[3] === 'oily') { baseScores.sebum -= 25; baseScores.pores -= 15; }
    if (answers[2] === 'sensitive' || answers[2] === 'inflammation') { baseScores.redness -= 30; baseScores.barrier -= 25; }

    Object.keys(baseScores).forEach(key => {
        baseScores[key] = Math.max(10, Math.min(95, baseScores[key]));
    });

    let weightedSum = 0;
    Object.keys(METRICS_CONFIG).forEach(key => {
        weightedSum += baseScores[key] * METRICS_CONFIG[key].weight;
    });
    const SHI = Math.round(weightedSum);

    let riskLevel = "safe";
    if (answers[1] === 'high_risk' || answers[2] === 'inflammation') riskLevel = "warning";
    else if (answers[1] === 'medium_risk' || answers[2] === 'sensitive') riskLevel = "caution";

    let confidence = 72;
    if (images.left && images.right) confidence += 15;
    if (images.closeup) confidence += 8;

    // Use the new smart recommendation engine
    const recommendations = getSmartRecommendations(baseScores, riskLevel);

    return { scores: baseScores, SHI, riskLevel, confidence, recommendations };
  };

  const result = step === 'result' ? calculateResult() : null;

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[800px] flex flex-col relative border border-slate-100">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-lg tracking-tight">SkinGuard Pro</span>
          </div>
          <div className="flex items-center gap-2">
            {step !== 'landing' && (
              <button onClick={() => setStep('landing')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                <RefreshCcw className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menu Overlay */}
        {isMenuOpen && <MenuPage onClose={() => setIsMenuOpen(false)} />}

        {/* Content Body */}
        <div className="flex-1 flex flex-col relative">
          
          {/* 1. Landing */}
          {step === 'landing' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white to-rose-50/50">
              <div className="relative mb-8">
                 <div className="absolute inset-0 bg-rose-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                 <ScanLine className="relative w-24 h-24 text-rose-500" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-slate-900">
                의학적 기준의<br/>
                <span className="text-rose-500">피부 정밀 진단</span>
              </h1>
              <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                단순 뷰티 체크가 아닙니다.<br/>
                ABCDE 위험 신호부터 7가지 피부 건강 지표까지,<br/>
                임상 알고리즘 기반으로 분석합니다.
              </p>
              <button onClick={handleStart} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                무료 정밀 진단 시작 <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="mt-8 flex gap-4 text-xs text-slate-400">
                <span onClick={() => setIsMenuOpen(true)} className="underline cursor-pointer hover:text-rose-500">지표 설명 보기</span>
                <span onClick={() => setIsMenuOpen(true)} className="underline cursor-pointer hover:text-rose-500">프리미엄 멤버십</span>
              </div>
            </div>
          )}

          {/* 2. Medical Quiz */}
          {step === 'quiz' && (
            <div className="flex-1 p-6 animate-slide-up bg-slate-50">
               <div className="flex gap-1 mb-8">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= currentQIdx ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                  ))}
               </div>
               <span className="text-rose-500 font-bold text-xs uppercase mb-2 block">Question {currentQIdx + 1}</span>
               <h2 className="text-xl font-bold mb-2 text-slate-900">{QUESTIONS[currentQIdx].text}</h2>
               <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm mb-8">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-slate-500 font-medium">{QUESTIONS[currentQIdx].subText}</span>
               </div>
               <div className="space-y-3">
                  {QUESTIONS[currentQIdx].options.map((opt, i) => (
                    <button key={i} onClick={() => handleQuizAnswer(opt.type)} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-rose-400 hover:shadow-md transition-all font-medium text-slate-700">
                       {opt.text}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* 3. Guide & Pre-Check */}
          {step === 'guide' && (
             <div className="flex-1 p-6 flex flex-col bg-white animate-fade-in">
                <h2 className="text-xl font-bold text-center mb-6">촬영 품질 보증 (Quality Gate)</h2>
                <div className="space-y-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-xl flex gap-4 items-center">
                        <Focus className="w-8 h-8 text-blue-500" />
                        <div>
                            <h3 className="font-bold text-sm">자동 초점 및 거리 감지</h3>
                            <p className="text-xs text-slate-500">흐릿한 사진은 분석에서 자동 제외됩니다.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl flex gap-4 items-center">
                        <Aperture className="w-8 h-8 text-orange-500" />
                        <div>
                            <h3 className="font-bold text-sm">조명 및 화이트밸런스</h3>
                            <p className="text-xs text-slate-500">그림자 없는 밝은 곳에서 촬영해주세요.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl flex gap-4 items-center">
                        <Layers className="w-8 h-8 text-purple-500" />
                        <div>
                            <h3 className="font-bold text-sm">다각도 정밀 분석 (권장)</h3>
                            <p className="text-xs text-slate-500">정면 외 측면 사진 추가 시 정확도 20% 상승.</p>
                        </div>
                    </div>
                </div>
                <button onClick={() => setStep('camera')} className="mt-auto w-full bg-rose-500 text-white font-bold py-4 rounded-xl hover:bg-rose-600 transition-colors">
                    촬영 시작하기
                </button>
             </div>
          )}

          {/* 4. Smart Camera */}
          {step === 'camera' && (
             <div className="flex-1 flex flex-col bg-black p-4 animate-fade-in">
                <div className="text-white text-center mb-4">
                    <h2 className="font-bold text-lg">
                        {currentView === 'front' ? '정면 촬영 (필수)' : (currentView === 'left' ? '좌측면 촬영 (권장)' : '우측면 촬영 (권장)')}
                    </h2>
                    <p className="text-xs text-slate-400">가이드 라인에 얼굴을 맞춰주세요</p>
                </div>
                
                <SmartCamera 
                    currentView={currentView}
                    onCapture={handleCapture}
                />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                />
                
                <div className="mt-4 flex justify-between px-2">
                    <div className="flex gap-2">
                        <div className={`w-2 h-2 rounded-full ${currentView === 'front' ? 'bg-white' : 'bg-slate-600'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${currentView === 'left' ? 'bg-white' : 'bg-slate-600'}`}></div>
                        <div className={`w-2 h-2 rounded-full ${currentView === 'right' ? 'bg-white' : 'bg-slate-600'}`}></div>
                    </div>
                    <button 
                        onClick={() => setStep('analyzing')} 
                        className="text-xs text-slate-400 underline hover:text-white"
                    >
                        이대로 분석 시작
                    </button>
                </div>
             </div>
          )}

          {/* 5. Analyzing */}
          {step === 'analyzing' && <AnalysisLoading onComplete={() => setStep('result')} />}

          {/* 6. Result Dashboard */}
          {step === 'result' && (
             <div className="flex-1 bg-slate-50 overflow-y-auto animate-fade-in pb-10">
                
                {/* 1. Triage Banner (If Risk) */}
                {result.riskLevel !== 'safe' && (
                    <div className={`p-4 ${result.riskLevel === 'warning' ? 'bg-red-600' : 'bg-orange-500'} text-white`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <AlertTriangle className="w-5 h-5" />
                            {result.riskLevel === 'warning' ? '위험 신호 감지 (Warning)' : '주의 요망 (Caution)'}
                        </div>
                        <p className="text-xs opacity-90">
                            {result.riskLevel === 'warning' 
                                ? '즉시 피부과 전문의 상담을 권장합니다. 비정상적인 병변 변화가 감지되었습니다.' 
                                : '피부 상태 변화가 관찰됩니다. 주기적인 모니터링이 필요합니다.'}
                        </p>
                    </div>
                )}

                {/* 2. SHI & Confidence Header */}
                <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-slate-100 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Skin Health Index</span>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-4xl font-black text-slate-900">{result.SHI}</h1>
                                <span className="text-sm font-medium text-slate-400">/ 100</span>
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${result.SHI >= 80 ? 'bg-emerald-100 text-emerald-600' : (result.SHI >= 60 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600')}`}>
                                {result.SHI >= 80 ? 'Excellent' : (result.SHI >= 60 ? 'Good' : 'Needs Care')}
                            </span>
                        </div>
                        <div className="text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-400 uppercase">Analysis Confidence</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${result.confidence > 80 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <span className="font-bold text-slate-700">{result.confidence}%</span>
                                </div>
                                {result.confidence < 80 && (
                                    <button className="text-[10px] text-rose-500 underline mt-1" onClick={() => setStep('camera')}>
                                        정확도 UP을 위해 재촬영 권고
                                    </button>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* 3. Radar Chart */}
                    <RadarChart data={result.scores} />
                </div>

                {/* 4. Detailed Metrics Grid */}
                <div className="px-5 space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Grid className="w-5 h-5 text-rose-500" /> 상세 분석 리포트
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {Object.keys(result.scores).map((key) => {
                            const score = result.scores[key];
                            const config = METRICS_CONFIG[key];
                            return (
                                <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-600 font-bold text-xs" style={{ color: config.color, backgroundColor: `${config.color}15` }}>
                                            {score}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{config.label}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase">{config.subLabel}</p>
                                        </div>
                                    </div>
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ width: `${score}%`, backgroundColor: config.color }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* 5. Priority Action (Dynamic & Scientific) */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                        <h3 className="font-bold mb-5 flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400">
                           <Maximize className="w-4 h-4" /> Top Priority Care
                        </h3>
                        <ul className="space-y-4">
                            {result.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex gap-4 items-start">
                                    {rec.type === 'critical' && <div className="bg-red-600 text-white font-bold text-[10px] px-2 py-1 rounded shrink-0 mt-0.5 animate-pulse">위험</div>}
                                    {rec.type === 'urgent' && <div className="bg-rose-500 text-white font-bold text-[10px] px-2 py-1 rounded shrink-0 mt-0.5">긴급</div>}
                                    {rec.type === 'care' && <div className="bg-orange-500 text-white font-bold text-[10px] px-2 py-1 rounded shrink-0 mt-0.5">관리</div>}
                                    {rec.type === 'tip' && <div className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded shrink-0 mt-0.5">Tip</div>}
                                    
                                    <div>
                                        <strong className="block text-sm font-bold text-white mb-1">{rec.title}</strong>
                                        <p className="text-xs text-slate-300 leading-relaxed">{rec.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Disclaimer */}
                    <div className="text-[10px] text-slate-400 leading-normal p-4 bg-slate-100 rounded-lg text-center mb-4">
                        본 서비스는 AI 분석을 통한 피부 상태 참고용이며, <strong>의학적 진단을 대체할 수 없습니다.</strong><br/>
                        정확한 진단 및 치료는 반드시 전문의와 상담하십시오.
                    </div>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}