"use client";

import { useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMutation } from "@tanstack/react-query";
import { createTopic } from "@/lib/actions";

const TopicCreator = () => {
  const [topic, setTopic] = useState("");

  const { mutate, error, isPending } = useMutation({
    mutationFn: createTopic,
  });

  return (
    <div className="mt-12 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          className="bg-white min-w-64"
          placeholder="Enter a topic here..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <Button
          disabled={isPending}
          onClick={() => mutate({ topicName: topic })}
        >
          {isPending ? "Creating..." : "Create"}
        </Button>

        {error && <p className="text-red-500">{error.message}</p>}
      </div>
    </div>
  );
};

export default TopicCreator;
