"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useContext, useEffect } from "react";
import { userContext } from "../context/userContext";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
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

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().min(1, {
    message: "Email is required",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }),
  confirmPassword: z.string().min(8, {
    message: "Retype the password",
  }),
  profilePic: z.any(),
});
const RegisterFrom = () => {
  // const [userDetails, setUserDetails] = useState({
  //   username: "",
  //   email: "",
  //   password: "",
  // });

  const router = useRouter();
  const context = useContext(userContext);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  if (!context) {
    throw new Error("RegisterForm must be used within a UserProvider");
  }
  const { userIsRegistered, registeredUser } = context;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  useEffect(() => {
    if (registeredUser) {
      router.push("/");
    }
  }, [router, registeredUser]);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    if (!file) {
      setError("Profile picture is required.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("profilePic", file);

      const res = await fetch(`http://localhost:4000/data`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to register");
      }

      console.log("User registered successfully:", result);
      router.push("/project-description");
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

    userIsRegistered(true);
  };

  return (
    <Card className="w-1/2 mx-auto my-3">
      <CardHeader>
        <CardTitle className="text-center">
          Register to project planner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Email */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Email 👇 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Enter your email</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password 👇 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" type="password" {...field} />
                  </FormControl>
                  <FormDescription>Enter a password</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Confirm password 👇 */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" type="password" {...field} />
                  </FormControl>
                  <FormDescription>Confirm your password</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Profile pic 👇 */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" type="password" {...field} />
                  </FormControl>
                  <FormDescription>Confirm your password</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
export default RegisterFrom;
