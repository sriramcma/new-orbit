import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Lock, Mail, Sparkles, AlertCircle, Database, Settings, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { saveCustomSupabaseCredentials, isSupabaseConfigured, supabaseUrl } from '../supabaseClient';
import { ThemeToggle } from '../components/ThemeToggle';

export const Login: React.FC = () => {
  const { signIn, resendConfirmation, enterDemoMode, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick configure drawer state
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResendStatus(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      navigate('/');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setErrorMsg('Please enter your email above to resend confirmation.');
      return;
    }
    setResending(true);
    setResendStatus(null);
    const { error } = await resendConfirmation(email);
    setResending(false);
    if (error) {
      setErrorMsg(error);
    } else {
      setResendStatus('Confirmation email sent! Please check your inbox and spam folder.');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl || !customKey) {
      setErrorMsg('Both Supabase URL and Anon Key are required.');
      return;
    }
    saveCustomSupabaseCredentials(customUrl, customKey);
  };

  const handleDemoLogin = () => {
    enterDemoMode();
    navigate('/');
  };

  const isEmailNotConfirmed = errorMsg?.toLowerCase().includes('email not confirmed');
  const isInvalidCredentials = errorMsg?.toLowerCase().includes('invalid login credentials');

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] text-[#111827] dark:text-[#f1f5f9] flex items-center justify-center p-4 relative transition-colors duration-200">
      {/* Theme toggle icon in the top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[440px] space-y-4">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-indigo-500 dark:from-[#818cf8] dark:to-indigo-400 text-white dark:text-slate-900 shadow-lg shadow-indigo-500/20 mb-1 font-bold text-xl tracking-wider transition-colors duration-200">
            <span>O</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200">
            Welcome to ORBIT
          </h1>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] transition-colors duration-200">
            Personal Life OS • Sign in to your orbit
          </p>
        </div>

        {/* Supabase Status Pill */}
        <div className="flex justify-center">
          {isSupabaseConnected ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80 transition-colors duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Supabase ({supabaseUrl ? new URL(supabaseUrl).hostname : 'Cloud'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/80 transition-colors duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Supabase Keys Pending (.env or below)
            </span>
          )}
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-[#e5e7eb] dark:border-[#334155] dark:bg-[#1e293b]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your personal dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{errorMsg}</span>
                </div>

                {(isInvalidCredentials || isEmailNotConfirmed) && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 text-[11px] space-y-2.5">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      💡 <strong>Why does Supabase show &quot;Invalid login credentials&quot; after signup?</strong>
                      <br />
                      Supabase hides unconfirmed accounts and blocks sign-in until email verification is complete.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resending}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        {resending ? 'Sending...' : 'Resend verification email'}
                      </button>
                    </div>

                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <p className="font-semibold text-xs">⚡ Fix in 5 seconds in Supabase:</p>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                        <li>Open your Supabase project → <strong>Authentication</strong> → <strong>Users</strong></li>
                        <li>Click <strong>...</strong> next to your email → Click <strong>&quot;Auto confirm user&quot;</strong></li>
                        <li>In <strong>Providers → Email</strong>, turn off <strong>&quot;Confirm email&quot;</strong> for instant login forever!</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {resendStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{resendStatus}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" /> Email address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" /> Password
                  </label>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In with Supabase'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0 border-t border-[#e5e7eb] dark:border-[#334155] mt-2">
            <div className="text-center text-xs text-[#6b7280] dark:text-[#94a3b8] pt-3">
              Don&apos;t have an account?{' '}
              <NavLink
                to="/signup"
                className="font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline"
              >
                Sign up
              </NavLink>
            </div>

            {/* Quick Demo Mode fallback */}
            <div className="w-full pt-1">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#e5e7eb] dark:border-[#334155]" />
                <span className="flex-shrink mx-2 text-[10px] text-[#6b7280] dark:text-[#94a3b8] uppercase font-medium">Or explore</span>
                <div className="flex-grow border-t border-[#e5e7eb] dark:border-[#334155]" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full text-xs"
                onClick={handleDemoLogin}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" />
                Continue with Demo Mode
              </Button>
            </div>

            {/* Optional credential config dropdown */}
            {!isSupabaseConfigured && (
              <div className="w-full text-center">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-[11px] text-[#6b7280] hover:text-[#6366f1] dark:text-[#94a3b8] dark:hover:text-[#818cf8] inline-flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  {showConfig ? 'Hide manual credentials' : 'Set custom Supabase credentials'}
                </button>

                {showConfig && (
                  <form onSubmit={handleSaveConfig} className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-left space-y-2 border border-[#e5e7eb] dark:border-[#334155]">
                    <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                      You can paste your Supabase keys here or define them in <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">.env</code>:
                    </p>
                    <Input
                      placeholder="VITE_SUPABASE_URL (https://xyz.supabase.co)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="VITE_SUPABASE_ANON_KEY (eyJ...)"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="text-xs"
                    />
                    <Button type="submit" size="sm" className="w-full text-xs">
                      Save & Reload
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};
