type SuggestedQuestionsProps = {
  questions: string[];
  onSelect: (question: string) => void;
};

// Tappable reply options shown under the latest agent message.
export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Suggested questions">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
