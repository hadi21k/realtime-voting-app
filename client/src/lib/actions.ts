"use server";

import { redirect } from "next/navigation";
import { redis } from "./redis";
import { wordFreq } from "./utils";
import { revalidatePath } from "next/cache";

export const createTopic = async ({ topicName }: { topicName: string }) => {
    const regex = /^[a-zA-Z--]+$/;

    if (!topicName || !regex.test(topicName) || topicName.length > 50) {
        return {
            error: "Invalid topic name",
        }
    }

    await redis.sadd("existing-topics", topicName)

    redirect(`/${topicName}`);
}


export const addComment = async ({
    comment,
    topicName,
}: {
    comment: string
    topicName: string
}) => {
    const words = wordFreq(comment)

    await Promise.all(
        words.map(async (word) => {
            await redis.zadd(
                `room:${topicName}`,
                { incr: true },
                { member: word.text, score: word.value }
            )
        })
    )

    await redis.incr("served_requests")

    await redis.publish(`room:${topicName}`, words)

    revalidatePath(`/${topicName}`)

    return comment
}