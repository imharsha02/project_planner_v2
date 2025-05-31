"use client";
import React, { useState, useEffect } from "react";
import { TypographyH1 } from "./ui/Typography/TypographyH1";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const HeadingAndLogo = () => {
  const [isLandingPage, setIsLandingPage] = useState(false);
  const pathName = usePathname();
  useEffect(() => {
    if (pathName === "/") {
      setIsLandingPage(true);
    } else {
      setIsLandingPage(false);
    }
  }, [pathName]);
  return (
    <div className="flex items-center justify-evenly">
      <Link href="/">
        <Image
          src="/globe.svg"
          alt="Site logo"
          className="m-3"
          width={32}
          height={32}
        />
      </Link>
      <TypographyH1 className="w-full tracking-wide">
        Project Planner
      </TypographyH1>
      {isLandingPage == true ? (
        <Button asChild className="m-3">
          <Link href="/register-me">Get Started</Link>
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
};

export default HeadingAndLogo;
