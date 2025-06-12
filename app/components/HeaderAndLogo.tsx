"use client";
import React, { useContext, useState, useEffect } from "react";
import { userContext } from "../context/userContext";
import { TypographyH1 } from "./ui/Typography/TypographyH1";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const HeadingAndLogo = () => {
  const context = useContext(userContext);
  if (!context) {
    throw new Error("HeaderAndLogo must be used within a UserProvider");
  }
  const { registeredUser, userData } = context;
  const pathName = usePathname();
  const [isLandingPage, setIsLandingPage] = useState(false);

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
      {isLandingPage && !registeredUser ? (
        <Button asChild>
          <Link href="/register-me">Get Started</Link>
        </Button>
      ) : registeredUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage
                src={userData?.profilePic || "https://github.com/shadcn.png"}
              />
              <AvatarFallback>
                {userData?.username?.slice(0, 2).toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>My Projects</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default HeadingAndLogo;
