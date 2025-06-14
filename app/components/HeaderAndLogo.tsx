"use client";
import React, { useContext, useState, useEffect } from "react";
import { userContext } from "../context/userContext";
import { TypographyH1 } from "./ui/Typography/TypographyH1";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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
  const { registeredUser, userData, userIsRegistered, setUserData } = context;
  const pathName = usePathname();
  const router = useRouter();
  const [isLandingPage, setIsLandingPage] = useState(false);

  useEffect(() => {
    if (pathName === "/") {
      setIsLandingPage(true);
    } else {
      setIsLandingPage(false);
    }
  }, [pathName]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      userIsRegistered(false);
      setUserData(null);
      router.push("/");
    }
  };

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
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register-me">Get Started</Link>
          </Button>
        </div>
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
            <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default HeadingAndLogo;
