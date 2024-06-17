"use client";

import MaxWidthWrapper from "@/components/MaxWidthWrapper";

import { useEffect, useState } from "react";

import { scaleLog } from "@visx/scale";
import { Text } from "@visx/text";
import { Wordcloud } from "@visx/wordcloud";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { addComment } from "@/lib/actions";

import { io } from "socket.io-client";

type Props = {
  topicName: string;
  initialData: { text: string; value: number }[];
};

const COLORS = [
  "#FF006E",
  "#00D166",
  "#FFD500",
  "#1EAE98",
  "#FF570A",
  "#FF006E",
  "#00D166",
  "#FFD500",
  "#1EAE98",
  "#FF570A",
];

const socket = io("http://localhost:8000");

const ClientPage = ({ initialData, topicName }: Props) => {
  const [words, setWords] = useState(initialData);
  const [comment, setComment] = useState("");

  const fontScale = scaleLog({
    domain: [
      Math.min(...words.map((w) => w.value)),
      Math.max(...words.map((w) => w.value)),
    ],
    range: [10, 100],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: addComment,
  });

  useEffect(() => {
    console.log("Joining room");
    socket.emit("join-room", `room:${topicName}`);
  }, [topicName]);

  useEffect(() => {
    socket.on("room-update", (message: string) => {
      const data = JSON.parse(message) as {
        text: string;
        value: number;
      }[];

      data.map((word) => {
        const isWordIncluded = words.some((w) => w.text === word.text);

        if (isWordIncluded) {
          setWords((prev) => {
            const before = prev.find((w) => w.text === word.text);
            const rest = prev.filter((w) => w.text !== word.text);

            return [
              ...rest,
              { text: before!.text, value: before!.value + word.value },
            ];
          });
        } else if (words.length < 25) {
          setWords((prev) => [...prev, word]);
        }
      });
    });

    return () => {
      socket.off("room-update");
    };
  }, [words]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-grid-zinc-50 pb-20">
      <MaxWidthWrapper className="flex flex-col items-center gap-6 pt-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-tight text-balance">
          What people think about{" "}
          <span className="text-blue-600">{topicName}</span>:
        </h1>

        <p className="text-sm">(updated in real-time)</p>

        <div className="aspect-square max-w-xl flex items-center justify-center">
          <Wordcloud
            words={words}
            width={300}
            height={300}
            fontSize={(data) => fontScale(data.value)}
            font={"Impact"}
            padding={2}
            spiral="archimedean"
            rotate={0}
            random={() => 0.5}
          >
            {(cloudWords) =>
              cloudWords.map((w, i) => (
                <Text
                  key={w.text}
                  fill={COLORS[i % COLORS.length]}
                  textAnchor="middle"
                  transform={`translate(${w.x}, ${w.y})`}
                  fontSize={w.size}
                  fontFamily={w.font}
                >
                  {w.text}
                </Text>
              ))
            }
          </Wordcloud>
        </div>

        <div className="max-w-lg w-full">
          <Label className="font-semibold tracking-tight text-lg pb-2">
            Here&apos;s what I think about {topicName}
          </Label>
          <div className="mt-1 flex gap-2 items-center">
            <Input
              value={comment}
              onChange={({ target }) => setComment(target.value)}
              placeholder={`${topicName} is absolutely...`}
            />
            <Button
              disabled={isPending}
              onClick={() => mutate({ comment, topicName })}
            >
              {isPending ? "Loading..." : "Submit"}
            </Button>
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default ClientPage;
