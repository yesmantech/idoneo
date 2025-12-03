'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
    }

    setLoading(false);

    router.refresh();
    router.push('/');
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-950 text-white">
      <div className="w-80 bg-gray-900 p-6 rounded-xl shadow-md">
        <h1 className="text-center text-2xl font-bold mb-6">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm mb-2">{error}</p>
        )}

        <button
          disabled={loading}
          onClick={handleAuth}
          className="w-full p-2 bg-indigo-600 hover:bg-indigo-500 transition rounded-lg"
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>

        <p
          className="text-center mt-4 text-sm cursor-pointer text-indigo-400 hover:text-indigo-300"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </p>
      </div>
    </div>
  );
}
