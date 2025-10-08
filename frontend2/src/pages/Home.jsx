import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import aiImg from "../assets/ai.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext);
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const [ham, setHam] = useState(false);
  const isRecognizingRef = useRef(false);
  const synth = window.speechSynthesis;

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("Recognition requested to start");
      } catch (error) {
        if (error.name !== "InvalidStateError") console.error("Start error:", error);
      }
    }
  };

const speak = (text) => {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';

    const setVoiceAndSpeak = () => {
      const voices = synth.getVoices();
      const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi')) || voices[0];
      if (hindiVoice) utterance.voice = hindiVoice;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        if (recognitionRef.current && isRecognizingRef.current) {
          recognitionRef.current.abort();
          isRecognizingRef.current = false;
        }
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        resolve();
        // restart mic after slight delay to avoid overlap
        setTimeout(() => startRecognition(), 1200);
      };

      // 🕓 slight delay ensures voices & synth are ready
      setTimeout(() => synth.speak(utterance), 200);
    };

    if (synth.getVoices().length > 0) setVoiceAndSpeak();
    else synth.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
  });
};

const handleCommand = async (data) => {
  console.log("🎯 Command data:", data);

  let { type, userInput } = data;
  const responseText =
    typeof data.response === "string"
      ? data.response
      : data.response?.response || "मुझे समझ नहीं आया।";

  setAiText(responseText);

  let commandType = type;
  if (type === "general") {
    const text = userInput.toLowerCase();
    if (text.includes("date")) commandType = "get-date";
    else if (text.includes("time")) commandType = "get-time";
    else if (text.includes("day")) commandType = "get-day";
    else if (text.includes("month")) commandType = "get-month";
    else if (text.includes("youtube")) commandType = "youtube-play";
    else if (text.includes("google")) commandType = "google-search";
    else if (text.includes("instagram")) commandType = "instagram-open";
    else if (text.includes("facebook")) commandType = "facebook-open";
    else if (text.includes("weather")) commandType = "weather-show";
    else if (text.includes("calculator")) commandType = "calculator-open";
    else commandType = "say";
  }

  // ✅ safe popup opener
  const openSafe = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 🧠 Speak first for confirmation (if needed)
  await speak(responseText);

  // 🎬 Execute action
  switch (commandType) {
    case "google-search":
      openSafe(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`);
      await speak(`Google पर ${userInput} खोज रहा हूँ`);
      break;

    case "youtube-search":
    case "youtube-play":
      openSafe(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`);
      await speak(`YouTube पर ${userInput} खोल रहा हूँ`);
      break;

    case "calculator-open":
      openSafe("https://www.google.com/search?q=calculator");
      await speak("कैलकुलेटर खोल रहा हूँ");
      break;

    case "instagram-open":
      openSafe("https://www.instagram.com/");
      await speak("Instagram खोल रहा हूँ");
      break;

    case "facebook-open":
      openSafe("https://www.facebook.com/");
      await speak("Facebook खोल रहा हूँ");
      break;

    case "weather-show":
      openSafe("https://www.google.com/search?q=weather");
      await speak("मौसम की जानकारी दिखा रहा हूँ");
      break;

    case "get-time": {
      const time = new Date().toLocaleTimeString("hi-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      await speak(`समय है ${time}`);
      break;
    }

    case "get-date": {
      const date = new Date().toLocaleDateString("hi-IN");
      await speak(`आज की तारीख है ${date}`);
      break;
    }

    case "get-day": {
      const day = new Date().toLocaleDateString("hi-IN", { weekday: "long" });
      await speak(`आज का दिन है ${day}`);
      break;
    }

    case "get-month": {
      const month = new Date().toLocaleDateString("hi-IN", { month: "long" });
      await speak(`इस महीने का नाम है ${month}`);
      break;
    }

    case "say":
      // already spoken
      break;

    default:
      console.log("❓ Unknown command type:", commandType);
  }
};

  useEffect(() => {
    if (!userData) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    let isMounted = true;
    const startTimeout = setTimeout(() => startRecognition(), 1000);

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) setTimeout(() => startRecognition(), 500);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        console.warn("No speech detected, restarting recognition...");
        setTimeout(() => startRecognition(), 500);
        return;
      }
      console.warn("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => startRecognition(), 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("🎤 Recognized text:", transcript);
      setUserText(transcript);

      try {
        const data = await getGeminiResponse(transcript);
        const finalResponse = typeof data.response === 'string'
                              ? data.response
                              : data.response?.response || "मुझे समझ नहीं आया।";

        setAiText(finalResponse);
        await handleCommand({ ...data, response: finalResponse, userInput: transcript });
      } catch (error) {
        console.error("❌ Error:", error);
      }

      setUserText("");
    };

    const greetingText = `Hello ${userData.name}, मैं आपकी मदद के लिए तैयार हूँ।`;
    speak(greetingText);

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.abort();
      setListening(false);
      isRecognizingRef.current = false;
    };
  }, [userData]);

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(true)} />
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]' onClick={() => navigate("/customize")}>Customize your Assistant</button>
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData.history?.map((his, i) => (
            <div key={i} className='text-gray-200 text-[18px] w-full h-[30px]'>{his}</div>
          ))}
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px]' onClick={() => navigate("/customize")}>Customize your Assistant</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="" className='h-full object-cover' />
      </div>

      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]' />}
      {aiText && <img src={aiImg} alt="" className='w-[200px]' />}
      <h1 className='text-white text-[18px] font-semibold text-wrap text-center px-4'>
        {userText || aiText}
      </h1>
    </div>
  );
}

export default Home;
