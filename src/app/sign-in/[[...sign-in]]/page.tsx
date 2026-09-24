
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background radial gradient decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Logo & Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1 mb-3 shadow-md border border-slate-200/80">
            <Image
              src="/logo.png"
              alt="OkeSite Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            OkeSite CRM
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Internal workspace &amp; finance tracker web agency
          </p>
        </div>

        {/* Clerk Sign-In Component Container */}
        <div className="w-full flex justify-center">
          <SignIn />
        </div>
      </div>
    </div>
  );
}

