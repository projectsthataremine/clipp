export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Checkout Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your payment was cancelled. You can close this window and return to Clipp to try again.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No charges were made to your account.
        </p>
      </div>
    </div>
  );
}
