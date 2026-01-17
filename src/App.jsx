import { useState, useRef } from "react";
import "./App.css";
import morse from "./assets/audio/stage1.wav";
import htglives from "./assets/image/htglives.jpg";
import MapStage from "./components/MapStage";
import { decryptAesGcm } from "./utils/crypto";
import Confetti from "react-confetti";

const ENCRYPTED_SECRETS = [
  {
    ct: "jsMa240EBa5p6aI6lhwBYwcRK/v2Ah5ysdZ/LJeI",
    iv: "as3d6vCoXdmGcE3y",
  },
  {
    ct: "TVPTnCa6oaNqRyOY9Ckl71ieDbm4s6sl+qKpf96VxoazSDVeow==",
    iv: "Rt2b4Ovfg87kE+kB",
  },
  {
    ct: "iS/iiZHX2L//MK1ttdoXqHiPooTrO7ubcmwvT/8cSreagD9ZDXWxZBwERC6vbi8fma1A/St9NcUQUiXe13rDdkk8GuHEXHOw",
    iv: "/yXYnSV+eFgQUyqs",
  },
  {
    ct: "1F37b52sKbv9oGN2l+VXJeYOdITuoSyVbnE992/lOuSYXCRikA==",
    iv: "UT5FPhBuVODd8N0R",
  },
  {
    ct: "cSHrDQaPcA/i0i9IisHVdcfE2AQp9vqKQhtkm738INS2AjwVAsPqY/g=",
    iv: "IxG6vctn/NZZlCaq",
  },
  {
    ct: "Ad/z3CJZnIbrfdm7JOAyJh3TGMrr/dXdgA==",
    iv: "icZiTI2VHDPkP156",
  },
];

const ENCRYPTED_TARGET = {
  ct: "ifxe2ieTM64eucZj7qz1GZ4bETDaP1BnfGFXMNgsFdfqAxloVw==",
  iv: "vPY5XNYc4Q2UOlsj",
};

const MATCH_THRESHOLD_METERS = 50; // allow 50m tolerance

function App() {
  const [inputValue, setInputValue] = useState("");
  const [inputJumpValue, setInputJumpValue] = useState("");
  const [stage, setStage] = useState(0);
  const [mapSolved, setMapSolved] = useState(false);
  const [sliderSolved, setSliderSolved] = useState(false);
  const [solvedSecret, setSolvedSecret] = useState(null);
  const [reachedFinal, setReachedFinal] = useState(false);
  const answerInputRef = useRef(null);

  const ENC_KEY_BASE64 = import.meta.env.VITE_ENC_KEY;

  const normalize = (s) => s?.toLowerCase().replaceAll(" ", "");

  const handleSubmit = async () => {
    const enc = ENCRYPTED_SECRETS[stage];
    if (!enc || !enc.ct) {
      alert("No secret configured for this stage.");
      return;
    }
    if (!ENC_KEY_BASE64) {
      alert("Encryption key missing; cannot validate answer.");
      return;
    }
    try {
      const plain = await decryptAesGcm(enc.ct, enc.iv, ENC_KEY_BASE64);
      if (normalize(inputValue) === normalize(plain || "")) {
        if (stage === ENCRYPTED_SECRETS.length - 1) {
          setReachedFinal(true);
          return;
        }
        setStage((s) => s + 1);
      } else {
        alert(WrongMessage[stage]);
      }
    } catch (err) {
      console.error(err);
      alert("Decryption failed.");
    }
    setInputValue("");
    if (answerInputRef.current) answerInputRef.current.value = "";
  };

  const handleStageJump = async (Secret) => {
    if (!Secret) {
      alert("Not a valid stage.");
      return;
    }
    if (!ENC_KEY_BASE64) {
      alert("Encryption key missing; cannot validate stage jump.");
      return;
    }
    const wanted = Secret.toLowerCase().replaceAll(" ", "");
    for (let i = 0; i < ENCRYPTED_SECRETS.length; i++) {
      const enc = ENCRYPTED_SECRETS[i];
      if (!enc?.ct) continue;
      try {
        const plain = await decryptAesGcm(enc.ct, enc.iv, ENC_KEY_BASE64);
        if ((plain || "").toLowerCase().replaceAll(" ", "") === wanted) {
          setStage(i + 1);
          setInputJumpValue("");
          return;
        }
      } catch (err) {
        console.debug("decrypt stage jump failed for index", i, err);
      }
    }
    alert("Not a valid stage.");
  };

  const haversineMeters = (a, b) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  };

  const decryptStageSecret = async (idx) => {
    const enc = ENCRYPTED_SECRETS[idx];
    if (!enc?.ct)
      throw new Error("No encrypted secret configured for index " + idx);
    if (!ENC_KEY_BASE64)
      throw new Error("Encryption key missing (VITE_ENC_KEY).");
    return await decryptAesGcm(enc.ct, enc.iv, ENC_KEY_BASE64);
  };

  const handleMapSelect = async (coords) => {
    if (!ENC_KEY_BASE64) {
      alert("Encryption key missing; cannot validate target.");
      return;
    }
    if (!ENCRYPTED_TARGET?.ct) {
      alert("Target not configured.");
      return;
    }
    try {
      const targetStr = await decryptAesGcm(
        ENCRYPTED_TARGET.ct,
        ENCRYPTED_TARGET.iv,
        ENC_KEY_BASE64
      );
      const [tlat, tlng] = targetStr.split(",").map(Number);
      if (!Number.isFinite(tlat) || !Number.isFinite(tlng)) {
        throw new Error("Invalid target coordinates after decrypt");
      }
      const distance = haversineMeters(coords, { lat: tlat, lng: tlng });
      if (distance <= MATCH_THRESHOLD_METERS) {
        setMapSolved(true);
        setSolvedSecret("Loading...");
        try {
          const plainSecret = await decryptStageSecret(stage);
          setSolvedSecret(plainSecret ?? "");
        } catch (err) {
          console.error("failed to decrypt solved secret", err);
          setSolvedSecret(null);
        }
      } else {
        alert(WrongMessage[stage]);
        console.debug("Distance (m):", distance);
      }
    } catch (err) {
      console.error(err);
      alert("Validation failed.");
    }
  };

  const handleSliderSolved = async () => {
    setSliderSolved(true);
    setSolvedSecret("Loading...");
    try {
      const plainSecret = await decryptStageSecret(stage);
      setSolvedSecret(plainSecret ?? "");
    } catch (err) {
      console.error("failed to decrypt solved secret", err);
      setSolvedSecret(null);
    }
  };

  const randomNumberInRange = (min, max) => {
    let number = Math.floor(Math.random() * (max - min + 1)) + min;
    if (number === 1987) number++;
    return number;
  };

  const Prompts = [
    "Can you see it?",
    "Can you hear it?",
    "This is the answer.",
    "Sometimes we forget our second home, there was a time it was a shed.",
    "Easy stage: Set it to Marcus' birth year.",
    "Can you finish it?",
  ];

  const WrongMessage = [
    "You're not looking hard enough.",
    "Most orders right served empty.",
    "The answer is right in front of you. Maybe you should be hexed too.",
    "That home is in the past, but its memory lingers, the shed is gone but never forgotten.",
    "You really don't know my birth year?",
    "Keep trying, the end is near, maybe not.",
  ];

  return (
    <div className="App">
      {!reachedFinal ? (
        <>
          <div className="top">
            <div className="top-horizontal">
              <p>Stage {stage + 1} of 6</p>
              <p>
                Changelog: v2 - Secrets are now encrypted: I see you Tulio
                Alves.
              </p>
            </div>
            <input
              type="text"
              value={inputJumpValue}
              onChange={(e) => setInputJumpValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleStageJump(inputJumpValue)
              }
              placeholder="Insert last known answer"
            />
            <button onClick={() => handleStageJump(inputJumpValue)}>
              Jump to Stage
            </button>
          </div>
          {stage == 3 && (
            <div className="map-container">
              <h2>{Prompts[stage]}</h2>
              <MapStage onSelect={handleMapSelect} />
              {mapSolved && (
                <div className="solved-modal">
                  The jump secret for this stage is:
                  <p>
                    {solvedSecret === null
                      ? " (failed to load)"
                      : ` ${solvedSecret}`}
                  </p>
                  <button onClick={() => setStage(stage + 1)}>Continue</button>
                </div>
              )}
            </div>
          )}
          <div className="center">
            {stage == 5 && (
              <img src={htglives} alt="HTG LIVES" className="htg-lives" />
            )}
            <div className="centered-container">
              {stage !== 3 && <h2>{Prompts[stage]}</h2>}
              {stage == 0 && <secret>The end of HTG</secret>}
              {stage == 1 && <audio src={morse} autoPlay loop />}
              {stage !== 3 && stage !== 4 && (
                <>
                  <input
                    type="text"
                    ref={answerInputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  <button onClick={handleSubmit}>Submit</button>
                </>
              )}
              {stage == 4 && (
                <div className="slider-container">
                  <input
                    type="range"
                    min="1980"
                    max="1990"
                    step="1"
                    className="slider"
                    value={inputValue}
                    onChange={(e) =>
                      setInputValue(randomNumberInRange(1980, 1990))
                    }
                  />
                  <input
                    type="number"
                    min="1980"
                    max="1990"
                    className="disguised-input"
                    value={inputValue === "" ? 1985 : inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      e.target.value === "1987" ? handleSliderSolved() : null;
                    }}
                  />
                  {sliderSolved && (
                    <div className="solved-modal">
                      The jump secret for this stage is:
                      <p>
                        {solvedSecret === null
                          ? " (failed to load)"
                          : ` ${solvedSecret}`}
                      </p>
                      <button
                        onClick={() => {
                          setStage(stage + 1);
                          setInputValue("");
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="center">
          <Confetti width={window.innerWidth} height={window.innerHeight} />
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=cvrxm5i0zQwn9GRr&autoplay=1"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            autoPlay
          ></iframe>
          <h1 className="final-message">MARCUS WILL TALK AGAIN!!</h1>
        </div>
      )}
    </div>
  );
}

export default App;
