import React from 'react';
import { Send, Star, Check } from 'lucide-react';

interface FeedbackFormProps {
  rating: number;
  setRating: (r: number) => void;
  category: string;
  setCategory: (c: string) => void;
  comments: string;
  setComments: (c: string) => void;
  feedbackSent: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  rating,
  setRating,
  category,
  setCategory,
  comments,
  setComments,
  feedbackSent,
  onSubmit,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#111C35]/90 border border-blue-100/80 dark:border-blue-900/40 shadow-[0_15px_35px_rgba(29,99,232,0.06)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-blue-900/30">
        <div>
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
            <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#1D63E8] flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </span>
            <span>Send Developer Feedback</span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">
            Help us refine sensitivity algorithms and gesture detection.
          </p>
        </div>

        {feedbackSent && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
            <Check className="w-3.5 h-3.5" />
            <span>Submitted!</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-heading">
          {/* Star Rating */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  aria-label={`Rate ${s} stars`}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-50 dark:bg-card/70 border border-slate-200 dark:border-blue-900/50 text-foreground text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 font-heading font-medium cursor-pointer"
            >
              <option value="General">General Experience</option>
              <option value="Accuracy">Gesture Accuracy</option>
              <option value="Performance">Hardware / FPS Performance</option>
              <option value="FeatureRequest">Feature Request</option>
            </select>
          </div>
        </div>

        {/* Feedback Textarea */}
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          required
          rows={3}
          placeholder="Share your thoughts on gesture responsiveness, camera compatibility, or desired workspaces..."
          className="w-full bg-slate-50/60 dark:bg-card/50 border border-slate-200 dark:border-blue-900/50 rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted resize-none leading-relaxed"
        />

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-[#1D63E8] hover:bg-[#1554c9] text-white font-heading font-bold text-xs shadow-[0_6px_16px_rgba(29,99,232,0.3)] flex items-center gap-2 transition-all duration-150 hover:-translate-y-[1px] active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>Submit Feedback</span>
          </button>
        </div>
      </form>
    </div>
  );
};
