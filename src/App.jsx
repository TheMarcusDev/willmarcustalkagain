import { useState } from "react";
import "./App.css";
import morse from "./assets/audio/stage1.wav";

import Countdown from "react-countdown";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [stage, setStage] = useState(0);

  const handleSubmit = () => {
    if (
      inputValue.toLowerCase().replaceAll(" ", "") ===
      Secrets[stage].toLowerCase().replaceAll(" ", "")
    ) {
      setStage(stage + 1);
    } else {
      alert(WrongMessage[stage]);
    }
    setInputValue("");
    document.querySelector("input").value = "";
  };

  const Prompts = [
    "Can you see it?",
    "Can you hear it?",
    "This is the answer.",
    "Continues in:",
  ];

  const Secrets = [
    "The end of HTG",
    "Maybe Marcus is hexed",
    "54 68 69 73 20 69 73 20 74 68 65 20 61 6e 73 77 65 72 2e",
  ];

  const WrongMessage = [
    "You're not looking hard enough.",
    "Most orders right served empty.",
    "The answer is right in front of you. Maybe you should be hexed too.",
  ];

  return (
    <div className="App">
      <div className="centered-container">
        <h2>{Prompts[stage]}</h2>
        {stage == 0 && <secret>{Secrets[stage]}</secret>}
        {stage == 1 && <audio src={morse} autoPlay />}
        {stage == 3 && <Countdown date={"2026-01-17T20:00:00Z"} />}
        {stage < 3 && (
          <>
            <input
              type="text"
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button onClick={handleSubmit}>Submit</button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
