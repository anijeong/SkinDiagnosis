import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, ChevronRight, RefreshCcw, Shield, Activity, Droplet, Sun, Moon, Sparkles, Upload } from 'lucide-react';

const questions = [
  {
    id: 1,
    text: "세안 후 피부가 당기는 느낌이 드나요?",
    options: [
      { text: "전혀 그렇지 않다 (기름짐)", type: "oily" },
      { text: "T존만 그렇다 (복합성)", type: "combination" },
      { text: "얼굴 전체가 당긴다 (건성)", type: "dry" }
    ]
  },
  {
    id: 2,
    text: "오후가 되면 화장이 얼마나 무너지나요?",
    options: [
      { text: "거의 그대로다", type: "dry" },
      { text: "코 주변만 번들거린다", type: "combination" },
      { text: "얼굴 전체가 번들거린다", type: "oily" }
    ]
  },
  {
    id: 3,
    text: "피부 트러블(여드름 등)이 자주 발생하나요?",
    options: [
      { text: "거의 없다", type: "resilient" },
      { text: "가끔 생리 주기 등에만", type: "normal" },
      { text: "자주 발생한다", type: "sensitive" }
    ]
  },
  {
    id: 4,
    text: "햇빛에 노출되었을 때 피부 반응은?",
    options: [
      { text: "쉽게 붉어진다", type: "sensitive" },
      { text: "검게 탄다", type: "resilient" },
      { text: "붉어졌다가 검게 변한다", type: "normal" }
    ]
  }
];

const LoadingAnalysis = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("이미지 스캔 중...");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    const msgTimer1 = setTimeout(() => setMessage("모공 상태 분석 중..."), 1500);
    const msgTimer2 = setTimeout(() => setMessage("주름 및 탄력 측정 중..."), 3000);
    const msgTimer3 = setTimeout(() => setMessage("색소 침착 레벨 확인 중..."), 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(msgTimer1);
      clearTimeout(msgTimer2);
      clearTimeout(msgTimer3);
    };
  }, []);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(onComplete, 500);
    }
  }, [progress, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
        <div 
          className="absolute inset-0 border-4 border-rose-400 rounded-full transition-all duration-200 ease-linear"
          style={{ clipPath: `inset(0 0 ${100 - progress}% 0)` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-10 h-10 text-rose-500 animate-pulse" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">AI 피부 정밀 분석 중</h2>
      <p className="text-slate-500 mb-6">{message}</p>
      <div className="w-full max-w-xs bg-slate-200 rounded-full h-2">
        <div 
          className="bg-rose-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState('landing'); // landing, quiz, upload, analyzing, result
  const [answers, setAnswers] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleStart = () => setStep('quiz');

  const handleAnswer = (questionId, optionType) => {
    setAnswers({ ...answers, [questionId]: optionType });
    if (questionId < questions.length) {
      // Move to next question automatically just for smooth UX, usually strictly controlled by index
    }
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const selectOption = (type) => {
    const newAnswers = { ...answers, [questions[currentQuestionIndex].id]: type };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 250);
    } else {
      setTimeout(() => setStep('upload'), 250);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = () => {
    if (selectedImage) {
      setStep('analyzing');
    }
  };

  const resetDiagnosis = () => {
    setStep('landing');
    setAnswers({});
    setSelectedImage(null);
    setCurrentQuestionIndex(0);
  };

  // Mock Result Logic
  const getResult = () => {
    const types = Object.values(answers);
    const oilyCount = types.filter(t => t === 'oily').length;
    const dryCount = types.filter(t => t === 'dry').length;
    
    let skinType = "복합성 (Combination)";
    let desc = "T존은 번들거리고 U존은 건조한 타입입니다. 부위별 맞춤 케어가 필요합니다.";
    let score = 78;
    
    if (oilyCount > dryCount) {
      skinType = "지성 (Oily)";
      desc = "유분 분비가 많아 모공 관리가 중요합니다. 가벼운 제형의 제품을 추천합니다.";
      score = 72;
    } else if (dryCount > oilyCount) {
      skinType = "건성 (Dry)";
      desc = "수분 부족으로 탄력이 저하될 수 있습니다. 고보습 제품 위주로 관리해주세요.";
      score = 65; // Dry skin usually implies lower hydration score mockup
    }

    return { skinType, desc, score };
  };

  const resultData = step === 'result' ? getResult() : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[700px] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-rose-500" />
            <span className="font-bold text-lg text-slate-800">PureSkin AI</span>
          </div>
          {step !== 'landing' && (
            <button onClick={resetDiagnosis} className="text-slate-400 hover:text-slate-600">
              <RefreshCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
          
          {/* LANDING */}
          {step === 'landing' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-48 h-48 bg-rose-50 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border border-rose-100 animate-ping opacity-20"></div>
                <img 
                  src="https://images.unsplash.com/photo-1596434300655-e48d371bd564?auto=format&fit=crop&q=80&w=400&h=400" 
                  alt="Healthy Skin" 
                  className="w-40 h-40 rounded-full object-cover shadow-lg z-10"
                />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-slate-900">당신의 피부, <br/>얼마나 알고 계신가요?</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                AI 진단 기술로 피부 상태를 분석하고<br/>
                나에게 딱 맞는 스킨케어 루틴을 찾아보세요.
              </p>
              <button 
                onClick={handleStart}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-rose-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                진단 시작하기 <ChevronRight className="w-5 h-5" />
              </button>
              <div className="mt-6 flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 데이터 보안</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> 98% 정확도</span>
              </div>
            </div>
          )}

          {/* QUIZ */}
          {step === 'quiz' && (
            <div className="flex-1 p-6 flex flex-col animate-slide-up">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8">
                <div 
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex-1">
                <span className="text-rose-500 font-bold text-sm mb-2 block">Q{questions[currentQuestionIndex].id}</span>
                <h2 className="text-2xl font-bold mb-8 leading-snug">
                  {questions[currentQuestionIndex].text}
                </h2>
                
                <div className="space-y-3">
                  {questions[currentQuestionIndex].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectOption(option.type)}
                      className="w-full p-4 text-left border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium text-slate-700 group-hover:text-rose-700">{option.text}</span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD */}
          {step === 'upload' && (
            <div className="flex-1 p-6 flex flex-col items-center animate-slide-up">
              <h2 className="text-xl font-bold mb-2">정밀 분석을 위한 사진 촬영</h2>
              <p className="text-slate-500 text-sm mb-8 text-center">
                화장이 없는 맨 얼굴을 밝은 곳에서 촬영해주세요.<br/>사진은 분석 후 즉시 삭제됩니다.
              </p>

              <div 
                className={`w-full aspect-square max-w-xs bg-slate-50 border-2 border-dashed ${selectedImage ? 'border-rose-500' : 'border-slate-300'} rounded-2xl flex flex-col items-center justify-center mb-8 relative overflow-hidden group cursor-pointer hover:bg-slate-100 transition-all`}
                onClick={() => fileInputRef.current.click()}
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="Uploaded" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-rose-500" />
                    </div>
                    <span className="text-slate-500 font-medium">사진 촬영 또는 업로드</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>

              <button 
                onClick={startAnalysis}
                disabled={!selectedImage}
                className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedImage 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {selectedImage ? '분석 시작하기' : '사진을 등록해주세요'}
              </button>
            </div>
          )}

          {/* ANALYZING */}
          {step === 'analyzing' && (
            <LoadingAnalysis onComplete={() => setStep('result')} />
          )}

          {/* RESULT */}
          {step === 'result' && (
            <div className="flex-1 bg-slate-50 overflow-y-auto animate-fade-in">
              {/* Score Header */}
              <div className="bg-white p-6 pb-10 rounded-b-[2rem] shadow-sm mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-slate-500 text-sm mb-1">고객님의 피부 타입</p>
                    <h2 className="text-2xl font-bold text-slate-800">{resultData.skinType}</h2>
                  </div>
                  <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">
                    피부나이 24세
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle 
                        cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        className="text-rose-500" 
                        strokeDasharray={`${2 * Math.PI * 40}`} 
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - resultData.score / 100)}`} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold text-slate-800">{resultData.score}</span>
                      <span className="text-[10px] text-slate-400">점</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {resultData.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-6 space-y-6 pb-8">
                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                      <Droplet className="w-5 h-5" />
                      <span className="font-bold text-sm">수분도</span>
                    </div>
                    <div className="text-lg font-bold text-slate-700">부족</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                      <div className="bg-blue-400 w-[30%] h-1.5 rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-yellow-500">
                      <Sun className="w-5 h-5" />
                      <span className="font-bold text-sm">유분도</span>
                    </div>
                    <div className="text-lg font-bold text-slate-700">적정</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
                      <div className="bg-yellow-400 w-[60%] h-1.5 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Routine Recommendation */}
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    맞춤 케어 루틴
                  </h3>
                  <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Sun className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">아침 루틴</h4>
                        <p className="text-xs text-slate-500">약산성 클렌징 → 히알루론산 토너 → 수분 크림</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-slate-100"></div>
                    <div className="flex gap-4 items-start">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <Moon className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">저녁 루틴</h4>
                        <p className="text-xs text-slate-500">이중 세안 → 진정 앰플 → 나이트 크림</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* CTA */}
                <button 
                  onClick={() => alert("준비 중인 기능입니다: 전문가 상담 연결")}
                  className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-colors"
                >
                  전문가 상담 예약하기
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}