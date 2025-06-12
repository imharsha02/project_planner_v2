"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { userContext } from "../context/userContext";
import { supabase } from "@/lib/supabaseClient";

const formSchema = z
  .object({
    username: z
      .string()
      .min(2, "Username must be at least 2 characters.")
      .max(50, "Username must not exceed 50 characters."),
    email: z.string().email("Invalid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters."),
    profilePic: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const context = useContext(userContext);
  if (!context) {
    throw new Error("RegisterForm must be used within a UserProvider");
  }
  const { userIsRegistered } = context;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!file) {
      setError("Profile picture is required.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 1. Sign up user with Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { username: values.username },
          },
        });
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      const userId = signUpData.user?.id;
      if (!userId) {
        setError("User registration failed. No user ID returned.");
        setIsLoading(false);
        return;
      }

      // 2. Upload profile picture to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-pic")
        .upload(`profilePic-${userId}`, file);
      if (uploadError) {
        setError(uploadError.message);
        setIsLoading(false);
        return;
      }
      const publicUrl = supabase.storage
        .from("profile-pic")
        .getPublicUrl(`profilePic-${userId}`).data.publicUrl;

      // 3. Save profile info in 'users' table
      const { error: profileError } = await supabase.from("users").upsert({
        id: userId,
        username: values.username,
        email: values.email,
        profilePic: publicUrl,
      });
      if (profileError) {
        setError(profileError.message);
        setIsLoading(false);
        return;
      }

      userIsRegistered(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/about-project");
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your username"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  We&apos;ll use this to contact you.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Create a secure password"
                  type="password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Must be at least 8 characters long.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Confirm Password
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Please enter the same password again.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profilePic"
          render={() => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Profile Picture
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="image/*"
                  />
                  <Upload className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Upload a profile picture (JPG, PNG, or GIF).
              </FormDescription>
              <FormMessage />
              {file && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {file.name} selected
                </p>
              )}
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}
