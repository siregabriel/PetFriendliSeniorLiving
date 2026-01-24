import Link from 'next/link';

export default function ExitoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Received!</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Your property has been registered and the payment of <strong>$4.99 USD</strong> was successful.
          <br/>
          A moderator will review your listing shortly.
        </p>
        <Link 
          href="/" 
          className="bg-green-600 text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition shadow-md"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}