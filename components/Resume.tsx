"use client";

import { useRef, useState } from "react";
import { saveResume } from "@/app/actions/saveResume";

export default function Resume({
  onUploaded,
}: {
  onUploaded: (resumeId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f && f.type === "application/pdf") {
      setFile(f);
      if (inputRef.current) inputRef.current.files = e.dataTransfer.files;
    } else {
      setMessage("❌ Please drop a valid PDF file.");
    }
  };

  const upload = async () => {
    if (!file) return setMessage("Please select a PDF first.");
    if (file.type !== "application/pdf") return setMessage("❌ Only PDF files allowed.");

    setUploading(true);
    setMessage("📤 Uploading & parsing...");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await saveResume(fd);
      setMessage("✅ Resume parsed & stored in Neon!");
      onUploaded(res.resumeId);

      // scroll smoothly to next section (Interview start)
      setTimeout(() => {
        const next = document.getElementById("interview-section");
        next?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } catch (e) {
      console.error(e);
      setMessage("❌ Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto py-10 px-6">
      <h2 className="text-2xl font-bold text-center mb-6">Upload Your Resume</h2>

      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-gray-400 dark:border-gray-600"
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          ref={inputRef}
          className="hidden"
          onChange={onChange}
        />
        <p className="text-gray-600 dark:text-gray-400">
          Drag & drop your resume here <br />
          <span className="text-sm">(.pdf only)</span>
        </p>
        <button
          type="button"
          className="mt-4 px-5 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition"
        >
          Browse Files
        </button>
      </div>

      {file && (
        <div className="mt-6 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
          <p className="text-gray-800 dark:text-gray-200 font-medium">
            Selected: <span className="font-semibold">{file.name}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Size: {(file.size / 1024).toFixed(2)} KB
          </p>
          <button
            onClick={upload}
            disabled={uploading}
            className={`mt-3 px-4 py-2 rounded-lg text-white transition ${
              uploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {uploading ? "Uploading..." : "Upload & Parse"}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 text-center text-sm font-medium">{message}</p>
      )}
    </section>
  );
}
