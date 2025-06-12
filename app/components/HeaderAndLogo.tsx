"use client";
import React, { useContext, useState, useEffect } from "react";
import { userContext } from "../context/userContext";
import { TypographyH1 } from "./ui/Typography/TypographyH1";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const HeadingAndLogo = () => {
  const context = useContext(userContext);
  if (!context) {
    throw new Error("HeaderAndLogo must be used within a UserProvider");
  }
  const { registeredUser } = context;
  const pathName = usePathname();
  const [isLandingPage, setIsLandingPage] = useState(false);
  const [userData, setUserData] = useState<{
    username: string;
    profilePic: string | null;
  } | null>(null);

  useEffect(() => {
    if (pathName === "/") {
      setIsLandingPage(true);
    } else {
      setIsLandingPage(false);
    }
  }, [pathName]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUserData(null);
        return;
      }
      const { data: profile, error } = await supabase
        .from("users")
        .select("username, profilePic")
        .eq("id", user.id)
        .single();
      if (error || !profile) {
        setUserData(null);
        return;
      }
      setUserData({
        username: profile.username,
        profilePic: profile.profilePic,
      });
    };

    fetchUserProfile();
  }, []);

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
        <Avatar>
          <AvatarImage
            src={userData?.profilePic || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>
            {userData?.username?.slice(0, 2).toUpperCase() || "CN"}
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
};

export default HeadingAndLogo;
