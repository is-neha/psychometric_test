"use client";

import { useState, useTransition, useEffect } from "react";
import { saveResponseAction, completeAttemptAction } from "@/app/actions";

function AudioButton({ text }: { text: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop playing if component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel anything currently playing globally
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a Hindi voice (or any Indian accent)
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("IN"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={handleToggle}
      className="ml-2 inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-slate-200 transition-colors"
      title="Listen"
    >
      {isPlaying ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
        </svg>
      )}
    </button>
  );
}

type TestWizardProps = {
  attemptId: string;
  questionnaire: any;
  initialResponses: Record<string, string>;
};

export function TestWizard({ attemptId, questionnaire, initialResponses }: TestWizardProps) {
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses);
  const [isPending, startTransition] = useTransition();

  // Flatten questions into a single array but keep section info
  const questionsList = questionnaire.sections.flatMap((section: any) =>
    section.questions.map((question: any) => ({
      ...question,
      sectionTitle: section.title,
      sectionDescription: section.description,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at the first unanswered question
    const firstUnanswered = questionsList.findIndex((q: any) => !initialResponses[q.id]);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });

  const currentQuestion = questionsList[currentIndex];
  const isLastQuestion = currentIndex === questionsList.length - 1;

  const handleOptionSelect = (optionId: string) => {
    // Update local state
    setResponses((prev) => ({ ...prev, [currentQuestion.id]: optionId }));

    // Auto-advance if not the last question (Optimistic UI)
    if (!isLastQuestion) {
      // Add a tiny delay to let the user see their selection before it jumps
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 350);
    }

    // Save to DB in the background
    startTransition(async () => {
      try {
        await saveResponseAction(attemptId, currentQuestion.id, optionId);
      } catch (error) {
        console.error("Failed to save response:", error);
      }
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await completeAttemptAction(attemptId);
      } catch (error) {
        console.error("Failed to submit:", error);
        alert("Please answer all questions before submitting.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
        {questionnaire.audience}
      </p>
      <h1 className="mt-2 text-3xl font-bold dark:text-slate-50">{questionnaire.title}</h1>
      <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">{questionnaire.description}</p>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm transition-colors">
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors">
          <h2 className="text-xl font-bold text-sky-950 dark:text-slate-100">{currentQuestion.sectionTitle}</h2>
          {currentQuestion.sectionDescription && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentQuestion.sectionDescription}</p>
          )}
        </div>

        <fieldset className="transition-opacity">
          <legend className="px-1 font-semibold leading-7 text-lg flex items-center">
            {currentQuestion.text}
            <AudioButton text={currentQuestion.text} />
          </legend>
          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option: any) => {
              const isSelected = responses[currentQuestion.id] === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 dark:border-slate-500 dark:bg-slate-800 text-sky-950 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question_${currentQuestion.id}`}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(option.id)}
                    className="mt-1 accent-sky-600 dark:accent-slate-400"
                  />
                  <span className="flex-1 flex items-center">
                    <span>
                      <strong className="mr-2 text-sky-800 dark:text-slate-200">{option.label}.</strong>
                      {option.text}
                    </span>
                    <AudioButton text={option.text} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 transition-colors">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isPending}
            className="rounded-xl px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          >
            &larr; Previous
          </button>

          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
            Progress: {Object.keys(responses).length} / {questionsList.length}
          </span>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isPending || Object.keys(responses).length < questionsList.length}
              className="rounded-xl bg-sky-700 dark:bg-slate-700 px-6 py-2 font-bold text-white hover:bg-sky-600 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Submitting..." : "Submit Assessment"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="rounded-xl px-4 py-2 font-semibold text-sky-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            >
              Skip / Next &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
