"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Share modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const readFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string);
    };
    reader.readAsText(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      readFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      readFile(droppedFile);
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent && !prompt) {
      alert("Upload a transcript or type a prompt!");
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: fileContent,
          prompt: prompt,
        }),
      });

      const data = await res.json();
      setSummary(data.summary || "No summary generated.");
    } catch (err) {
      console.error(err);
      setSummary("Error generating summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      setMessage("❌ Please enter a valid email.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Meeting Summary",
          text: summary,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Email sent successfully!");
        setEmail("");
      } else {
        setMessage(`❌ ${data.error || "Failed to send email."}`);
      }
    } catch (_err) {
      setMessage("❌ Something went wrong.");
    }
    setSending(false);
  };

  return (
    <main
      className={`flex flex-col min-h-screen items-center justify-center text-white transition px-4 ${isDragging ? "bg-neutral-800/80 blur-[1px]" : "bg-neutral-900"
        }`}
    >
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="text-xl italic text-gray-200">
          summarise and share your meetings notes.
        </h1>

       
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-neutral-800 rounded-full px-4 py-2 shadow-md space-x-2"
        >
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="mr-2 cursor-pointer text-gray-400 hover:text-white"
          >
            📎
          </label>

          {file && (
            <div className="flex items-center bg-neutral-700 px-2 py-1 rounded-full text-sm text-gray-200">
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileContent("");
                }}
                className="ml-2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add your custom prompt..."
            className="flex-1 bg-transparent outline-none placeholder-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-full px-4 py-2"
          >
            ➤
          </button>
        </form>

        
        <div className="rounded-xl shadow-md overflow-hidden">
          <div className="bg-neutral-800 h-[400px] overflow-y-auto p-6 text-left">
            {loading ? (
              <p className="text-gray-400">Generating summary...</p>
            ) : summary ? (
              <div className="flex flex-col h-full mb-4">
                <div className="flex justify-between mb-4 items-center">
                  <span className="text-gray-400 text-sm">Summary</span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditMode(!editMode)}
                      className="text-blue-400 hover:underline text-sm"
                    >
                      {editMode ? "Preview" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-green-400 hover:underline text-sm"
                    >
                      Share
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full h-full bg-neutral-900 text-gray-200 p-3 rounded-lg resize-none"
                  />
                ) : (
                  <div className="prose prose-invert max-w-none space-y-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-blue-400 border-b border-gray-700 pb-1">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold text-gray-200 mt-4">
                            {children}
                          </h2>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 space-y-2 text-gray-300">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-300 leading-relaxed">
                            {children}
                          </p>
                        ),
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Your summary will appear here...
              </p>
            )}
          </div>
        </div>
      </div>

      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-neutral-900 rounded-2xl p-6 w-96 shadow-xl border border-neutral-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-200">
              Share via Email
            </h2>

            <input
              type="email"
              placeholder="Enter recipient email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 text-gray-200 placeholder-gray-400 rounded-xl px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition disabled:bg-gray-600"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            {message && (
              <p className="mt-4 text-sm text-gray-300">{message}</p>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
