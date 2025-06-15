import React from "react";
import { TypographyH2 } from "./components/ui/Typography/TypographyH2";
const LandingPage = () => {
  return (
    <div className="my-3">
      <TypographyH2 className="border-none text-center">
        Tell about your project
      </TypographyH2>
      <TypographyH2 className="border-none text-center">Plan it</TypographyH2>
      <TypographyH2 className="border-none text-center">Track it</TypographyH2>
    </div>
  );
};

export default LandingPage;
