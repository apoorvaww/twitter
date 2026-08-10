import { useState } from "react";
import { api } from "../api/client.js";

export default function ComposeBox({ onTweetCreated }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!content.trim()) return;

    setPosting(true);
    setError(null);

    try {
      const { tweet } = await api.createTweet(content);

      setContent("");
      onTweetCreated?.(tweet);
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  const remaining = 280 - content.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="
        border-b
        border-gray-200
        dark:border-gray-800
        px-4
        py-4
      "
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-gray-200
              dark:bg-gray-800
              text-lg
              font-bold
              text-gray-600
              dark:text-gray-300
            "
          >
            👤
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            maxLength={280}
            rows={3}
            className="
              block
              w-full
              resize-none
              border-none
              bg-transparent
              px-0
              py-2
              text-xl
              leading-relaxed
              text-black
              dark:text-white
              placeholder-gray-500
              outline-none
              focus:ring-0
            "
          />

          {/* Error */}
          {error && (
            <p
              className="
                mb-3
                rounded-lg
                bg-red-500/10
                px-3
                py-2
                text-sm
                text-red-500
              "
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Action icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-[#1d9bf0]
                  hover:bg-blue-500/10
                "
                aria-label="Add image"
              >
                🖼️
              </button>

              <button
                type="button"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-[#1d9bf0]
                  hover:bg-blue-500/10
                "
                aria-label="Add GIF"
              >
                GIF
              </button>

              <button
                type="button"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-[#1d9bf0]
                  hover:bg-blue-500/10
                "
                aria-label="Add emoji"
              >
                😊
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Character counter */}
              {content.length > 0 && (
                <span
                  className={`
                    text-xs
                    ${
                      remaining <= 20
                        ? remaining <= 0
                          ? "font-bold text-red-500"
                          : "font-medium text-yellow-500"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {remaining}
                </span>
              )}

              {/* Tweet button */}
              <button
                type="submit"
                disabled={posting || !content.trim()}
                className="
                  rounded-full
                  bg-[#1d9bf0]
                  px-5
                  py-2
                  text-sm
                  font-bold
                  text-white
                  transition

                  hover:bg-[#1a8cd8]

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {posting ? "Posting..." : "Tweet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
