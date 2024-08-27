"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

const IndexPage: React.FC = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const createRoom = async (name: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SOCKET_URL}/room/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      localStorage.setItem("name", name);

      router.push(`/room/${data.roomId}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRoom(values.name);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold">Refinr</h1>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Enter your name to start a new Refinr session.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col space-y-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Start a session
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
