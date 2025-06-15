"use client";
import React from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TypographyH2 } from "../components/ui/Typography/TypographyH2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";

const formSchema = z.object({
  projectTitle: z
    .string()
    .min(2, "Project title must be at least 2 characters"),
  projectDepartment: z
    .string()
    .min(2, "Department name must be at least 2 characters"),
  projectDescription: z
    .string()
    .min(2, "Description must be at least 2 characters"),
  projectSteps: z.array(
    z.object({
      step: z.string().min(1, "Step description is required"),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

const AboutProjectPage = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectTitle: "",
      projectDepartment: "",
      projectDescription: "",
      projectSteps: [{ step: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "projectSteps",
  });

  function onSubmit(data: FormValues) {
    console.log(data);
    // Here you can handle the form submission
    // For example, send the data to your API
  }

  return (
    <Card className="w-1/2 mx-auto my-3">
      <CardHeader>
        <CardTitle>
          <TypographyH2 className="border-none tracking-wide">
            Project Details
          </TypographyH2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter department name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Project Steps</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`projectSteps.${index}.step`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Step ${index + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => append({ step: "" })}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Suggest Steps
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AboutProjectPage;
