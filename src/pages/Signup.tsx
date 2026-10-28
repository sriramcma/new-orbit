import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Sparkles, AlertCircle, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';

export const Signup: React.FC = () => {
  const { signUp, enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setEmailConfirmationRequired(false);

    const { error, requiresEmailConfirmation } = await signUp(email, password, name);
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else if (requiresEmailConfirmation) {
      setEmailConfirmationRequired(true);
    } else {
      // Session automatically created (email confirmation is off in Supabase)
      navigate('/');
    }
  };

  const handleDemoLogin = () => {
    enterDemoMode();
    navigate('/');
  };

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
            Create your ORBIT
          </h1>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] transition-colors duration-200">
            Initialize your unified personal operating system
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-lg border-[#e5e7eb] dark:border-[#334155] dark:bg-[#1e293b]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sign Up</CardTitle>
            <CardDescription>
              Create your account with Supabase Auth to save and sync data.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {emailConfirmationRequired ? (
              <div className="space-y-3 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-[#111827] dark:text-[#f1f5f9]">
                <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Account created successfully!
                </div>
                <p className="leading-relaxed text-[#6b7280] dark:text-[#94a3b8]">
                  A confirmation email has been sent to <span className="font-semibold text-[#111827] dark:text-white">{email}</span>. Please click the link in your email to verify before logging in.
                </p>

                <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 text-[11px] text-amber-700 dark:text-amber-300">
                  <p className="font-medium">💡 Want instant login without confirming email?</p>
                  <p className="mt-0.5 text-gray-600 dark:text-gray-300">
                    In Supabase Dashboard → <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Email</strong>, turn off <strong>&quot;Confirm email&quot;</strong>.
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full mt-2"
                  onClick={() => navigate('/login')}
                >
                  Go to Sign In <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" /> Full name
                  </label>
                  <Input
                    type="text"
                    placeholder="Alex Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

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
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" /> Password
                  </label>
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" /> Confirm password
                  </label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account with Supabase'}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-0 border-t border-[#e5e7eb] dark:border-[#334155] mt-2">
            <div className="text-center text-xs text-[#6b7280] dark:text-[#94a3b8] pt-3">
              Already have an account?{' '}
              <NavLink
                to="/login"
                className="font-semibold text-[#6366f1] dark:text-[#818cf8] hover:underline"
              >
                Sign in
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
                Explore in Demo Mode
              </Button>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};
