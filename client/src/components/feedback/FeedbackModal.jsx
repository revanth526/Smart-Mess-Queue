import { useState, useEffect } from 'react';
import { useSubmitFeedback, useUpdateFeedback } from '../../hooks/useFeedback.js';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export function FeedbackModal({
  isOpen,
  onClose,
  bookingId,
  menuId,
  mealType,
  mealContextText,
  existingFeedback,
  onSuccess,
}) {
  const [rating, setRating] = useState(existingFeedback?.rating ?? 5);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState(existingFeedback?.comment ?? '');
  const [errorMessage, setErrorMessage] = useState(null);

  const submitMutation = useSubmitFeedback();
  const updateMutation = useUpdateFeedback();

  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setComment(existingFeedback.comment ?? '');
    } else {
      setRating(5);
      setComment('');
    }
    setErrorMessage(null);
  }, [existingFeedback, isOpen]);

  if (!isOpen) return null;

  const isSubmitting = submitMutation.isPending || updateMutation.isPending;
  const isEditing = Boolean(existingFeedback?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5');
      return;
    }

    try {
      if (isEditing && existingFeedback?.id) {
        await updateMutation.mutateAsync({
          id: existingFeedback.id,
          payload: {
            rating: Number(rating),
            comment: comment.trim() || null,
          },
        });
      } else {
        const payload = {
          bookingId,
          rating: Number(rating),
          comment: comment.trim() || null,
        };
        if (menuId) payload.menuId = menuId;
        if (mealType) payload.mealType = mealType;

        await submitMutation.mutateAsync(payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to save feedback');
      setErrorMessage(msg);
    }
  };

  const activeRating = hoverRating ?? rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 id="feedback-modal-title" className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Meal Feedback' : 'Rate Your Meal'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{mealContextText}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Your Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    className={`h-8 w-8 transition-colors ${
                      star <= activeRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-transparent'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              ))}
              <span className="ml-3 text-sm font-semibold text-gray-700">
                {RATING_LABELS[activeRating]}
              </span>
            </div>
          </div>

          {/* Comment Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="feedback-comment"
                className="text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Comments (Optional)
              </label>
              <span className="text-xs text-gray-400">{comment.length} / 500</span>
            </div>
            <textarea
              id="feedback-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the food quality, taste, and mess queue experience?"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Feedback' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

