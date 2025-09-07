"use client";

import { useState, useRef } from "react";
import { startInterview } from "@/app/actions/startInterview";
import { submitAnswer } from "@/app/actions/submitAnswer";
import { finalizeInterview } from "@/app/actions/finalizeInterview";

// ✅ SpeechRecognition shim for TS
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Interview({ resumeId }: { resumeId: string }) {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [recordedFiles, setRecordedFiles] = useState<(File | null)[]>([]);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [answersSubmitted, setAnswersSubmitted] = useState<boolean[]>([]);

  const [finalFeedback, setFinalFeedback] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  // Start interview: generate questions
  const begin = async () => {
    setStatus("Generating questions...");
    try {
      const r = await startInterview(resumeId);
      setInterviewId(r.interviewId);
      setQuestions(r.questions);
      setRecordedFiles(new Array(r.questions.length).fill(null));
      setTranscripts(new Array(r.questions.length).fill(""));
      setAnswersSubmitted(new Array(r.questions.length).fill(false));
      setStatus("Ready! Record or upload your answers.");
    } catch (e) {
      console.error(e);
      setStatus("Failed to start interview.");
    }
  };

  // Start recording
  const startRecording = async (qIdx: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setChunks([]);
        const file = new File([blob], `answer-q${qIdx + 1}.webm`, {
          type: "audio/webm",
        });

        // Save locally
        setRecordedFiles((prev) => {
          const updated = [...prev];
          updated[qIdx] = file;
          return updated;
        });

        setStatus(`✅ Finished recording for Q${qIdx + 1}. You can upload or retry.`);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingIndex(qIdx);
      setStatus(`🎙️ Recording answer for Q${qIdx + 1}...`);

      // Setup speech recognition
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join(" ");
        setTranscripts((prev) => {
          const updated = [...prev];
          updated[qIdx] = transcript;
          return updated;
        });
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Recording failed:", err);
      setStatus("❌ Could not start recording. Please allow microphone access.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setRecordingIndex(null);
  };

  // Upload answer
  const uploadAnswer = async (qIdx: number) => {
    const file = recordedFiles[qIdx];
    const transcript = transcripts[qIdx] || "";

    if (!file) {
      setStatus(`❌ No recording for Q${qIdx + 1}`);
      return;
    }

    setStatus(`Uploading Q${qIdx + 1}...`);
    try {
      const fd = new FormData();
      fd.append("interviewId", interviewId!);
      fd.append("questionIndex", String(qIdx));
      fd.append("audio", file);
      if (transcript) fd.append("transcript", transcript);

      await submitAnswer(fd);

      setAnswersSubmitted((prev) => {
        const updated = [...prev];
        updated[qIdx] = true;
        return updated;
      });

      setStatus(`✅ Q${qIdx + 1} saved.`);
    } catch (e) {
      console.error(e);
      setStatus(`❌ Upload failed for Q${qIdx + 1}`);
    }
  };

  // Retry a question
  const retryRecording = (qIdx: number) => {
    setRecordedFiles((prev) => {
      const updated = [...prev];
      updated[qIdx] = null;
      return updated;
    });
    setTranscripts((prev) => {
      const updated = [...prev];
      updated[qIdx] = "";
      return updated;
    });
    setAnswersSubmitted((prev) => {
      const updated = [...prev];
      updated[qIdx] = false;
      return updated;
    });
    setStatus(`🔄 Ready to retry Q${qIdx + 1}.`);
  };

  // Finalize and get overall feedback
  const finishInterview = async () => {
    setStatus("Analyzing overall performance...");
    try {
      const res = await finalizeInterview(interviewId!);
      setFinalFeedback(res);
      setStatus("✅ Interview completed. See feedback below.");
    } catch (e) {
      console.error(e);
      setStatus("❌ Failed to finalize interview.");
    }
  };

  const allSubmitted =
    questions.length > 0 && answersSubmitted.every((done) => done);

  return (
    <section className="w-full max-w-3xl mx-auto px-6 pb-16">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Interview</h3>
        {!interviewId && (
          <button
            onClick={begin}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Generate Questions
          </button>
        )}
      </div>

      {status && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{status}</p>
      )}

      {questions.length > 0 && (
        <ul className="space-y-6">
          {questions.map((q, i) => (
            <li
              key={i}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <p className="font-medium mb-3">Q{i + 1}. {q}</p>

              {/* Recorder Controls */}
              {recordingIndex === i ? (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ⏹ Stop Recording
                </button>
              ) : recordedFiles[i] ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => uploadAnswer(i)}
                    disabled={answersSubmitted[i]}
                    className={`px-4 py-2 rounded-lg text-white ${
                      answersSubmitted[i]
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    ⏏ Upload
                  </button>
                  <button
                    onClick={() => retryRecording(i)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startRecording(i)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🎙️ Record Answer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Finish button */}
      {allSubmitted && !finalFeedback && (
        <div className="mt-6 text-center">
          <button
            onClick={finishInterview}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ✅ Finish Interview
          </button>
        </div>
      )}

      {/* Final Feedback */}
      {finalFeedback && (
        <div className="mt-10 p-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-lg font-semibold mb-3">📊 Overall Feedback</h4>
          <p className="mb-4">{finalFeedback.summary}</p>
          <div className="mb-3">
            <h5 className="font-medium">✅ Strengths</h5>
            <ul className="list-disc ml-6 text-sm">
              {finalFeedback.strengths?.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium">⚡ Improvements</h5>
            <ul className="list-disc ml-6 text-sm">
              {finalFeedback.improvements?.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="mt-4 font-medium">
            Overall Score: <span className="text-purple-600">{finalFeedback.overall_score}</span>/10
          </p>
        </div>
      )}
    </section>
  );
}
