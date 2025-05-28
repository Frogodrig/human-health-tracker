import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-lg border-0 bg-white/80 backdrop-blur-sm",
          },
        }}
        redirectUrl="/onboarding"
      />
    </div>
  );
}
