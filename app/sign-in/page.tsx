import React from "react";
import SignInForm from "../components/SignInForm";

const SignInPage = () => {
  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      <SignInForm />
    </div>
  );
};

export default SignInPage;
