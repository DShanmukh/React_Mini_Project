import { useState, useEffect } from 'react';
import speech, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';
import 'regenerator-runtime';
import FileDownload from 'react-file-download'; // Import FileDownload

function App() {
  const { listening, transcript, resetTranscript } = useSpeechRecognition();
  const [aiText, setAiText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeunload', pauseOnUnload);

    return () => {
      window.removeEventListener('beforeunload', pauseOnUnload);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      pausefun();
    }, 60000);

    return () => clearTimeout(timeout);
  }, []);

  const pauseOnUnload = () => {
    pausefun();
  };

  async function callGpt3API(message) {
    setThinking(true);
    const data = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Authorization: 'Bearer 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'
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        model: "gpt-3.5-turbo",
      }),
    })
      .then((res) => res.json());
    setThinking(false);
    return data.choices[0].message.content;
  }

  useEffect(() => {
    if (!listening && transcript) {
      callGpt3API(transcript).then((response) => {
        const speechSynthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(response);
        if (!paused) {
          speechSynthesis.speak(utterance);
        }
        setAiText(response);
      });
    }
  }, [transcript, listening, paused]);

  const stopfun = () => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance("");
    speechSynthesis.speak(utterance);
    speechSynthesis.cancel();
    speech.stopListening();
  }

  const pausefun = () => {
    const speechSynthesis = window.speechSynthesis;
    speechSynthesis.pause();
    setPaused(true);
  }

  const resumefun = () => {
    const speechSynthesis = window.speechSynthesis;
    speechSynthesis.resume();
    setPaused(false);
  }

  const reset = () => {
    resetTranscript();
    setAiText("");
    stopfun();
  };

  const downloadTranscript = () => {
    let fullText = "Transcript:\n\n";
    if (transcript) {
      fullText += transcript + "\n\n";
    }
    fullText += "AI Response:\n\n";
    if (aiText) {
      fullText += aiText;
    }
    if (fullText) {
      // Create an utterance for the full text
      const audioUtterance = new SpeechSynthesisUtterance(fullText);
      
      // Generate audio from the utterance
      window.speechSynthesis.speak(audioUtterance);
  
      // After the audio is generated, wait for a short duration for it to complete
      setTimeout(() => {
        // Create a new Blob object from the audio data
        const audioBlob = new Blob([new Uint8Array(window.speechSynthesis.getAudioData())], { type: 'audio/wav' });
        
        // Create a URL for the Blob object
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create an anchor element for downloading
        const downloadLink = document.createElement('a');
        downloadLink.href = audioUrl;
        downloadLink.download = 'audio.wav';
        downloadLink.click();
        
        // Clean up by revoking the URL
        URL.revokeObjectURL(audioUrl);
      }, 2000); // Adjust the delay according to the length of the audio
    }
  };
  

  return (
    <>
      {listening ? (
        <p><i class="fa-solid fa-microphone"></i></p>
      ) : (
        <p>Press  <i class="fa-solid fa-microphone"> </i> to start</p>
      )}
      <center>
        <div className="div1">
          <button onClick={() => {speech.startListening({continuous:true,language:"en -IN"});}}><i class="fa-solid fa-microphone"></i></button>
          <button onClick={() => {stopfun();}}><i class="fa-solid fa-stop"></i></button>
          <button onClick={() => {pausefun();}}><i class="fa-solid fa-pause"></i></button>
          <button onClick={() => {resumefun();}}><i class="fa-solid fa-play"></i></button>
          <button onClick={() => {reset()}}><i class="fa-solid fa-trash"></i></button>
          
        </div>
      </center>
      <center>
        <div className={`card ${listening ? 'highlight' : ''} ${transcript ? 'highlight' : ''}`}>
          {transcript && <div>User : {transcript}</div>}
          {thinking && <div>Generating....</div>}
          {aiText && <div>AI generated : <span class='b'>{aiText}</span></div>}
        </div>
      </center>
      <button className='but1'onClick={() => {downloadTranscript()}}>Download here.. <i class="fa-regular fa-circle-down"></i></button> {/* Button to download transcript */}
    </>
  );
}

export default App;
