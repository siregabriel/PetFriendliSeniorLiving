import Link from 'next/link';

export default function ExitoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-white p-4 text-center">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Received!</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your property has been registered and the payment of{' '}
          <span className="font-semibold text-gray-700">$4.99 USD</span> was successful.
          A moderator will review your listing shortly.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-full hover:from-rose-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
