'use client';

import { AppBskyFeedGetAuthorFeed } from "@atproto/api";
import { useEffect, useState } from 'react';
import { BSKY_AUTHOR_FEED } from "../../lib/constants";
import { Reposted, Likes, Comments } from "../../lib/icons";

export default function BskySectionRecentPosts() {
    const [feedData, setFeedData] = useState([]);
    const currentDate = new Date();

    useEffect(() => {
        getAuthorFeed().then(data => setFeedData(data.feed));
    }, []);

    return (
        <section className='mx-1'>
            <h1 className="font-bold text-3xl my-8 text-center">Posts from Bluesky</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
                {feedData.length > 0 &&
                    feedData.map((data, index) => {
                        const date = new Date(data.post.record.createdAt);
                        const daysAgo = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                        const renderTimeFromPost = daysAgo === 0 ?
                            "Today" :
                            daysAgo >= 7 ?
                                `${daysAgo % 7} weeks ago` :
                                `${daysAgo} days ago`;
                        const isReposted = data.reason !== undefined && data.reason.$type === "app.bsky.feed.defs#reasonRepost";
                        const postLink = `https://bsky.app/profile/${data.post.author.handle}/post/${data.post.uri.split("/")[4]}`;

                        return (
                            <article key={index} className="shadow-small rounded-2xl h-fit bg-sg-multicolour hover:shadow-medium transition-shadow duration-200">
                                <div className="mb-0 backdrop-blur-xl rounded-2xl">

                                    {/* This should be moved to a separate component */}
                                    <div className="pb-4"></div>
                                    {isReposted ? <span className="flex flex-row ml-20 mt-0 items-center gap-2"> <Reposted height="18px" width="18px" /> Reposted by me</span> : ""}
                                    <div className="flex flex-row justify-between">
                                        <div className="flex gap-4 gap-y-4 rounded-2xl">
                                            <img className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5" src={data.post.author.avatar} />
                                            <p className="line-clamp-1 text-lg self-center flex flex-col">
                                                {data.post.author.displayName ?? data.post.author.handle}{" "}
                                                <span className="text-gray-500 font-bold text-sm">@{data.post.author.handle}</span>
                                            </p>
                                        </div>
                                        <p className="self-center mr-5 text-sm">{renderTimeFromPost}
                                        </p>
                                    </div>

                                    {/* This should be moved to a separate component */}
                                    <div className="py-3 px-5">
                                        <p className="text-lg">{data.post.record.text}</p>

                                        {data?.post?.embed?.$type === "app.bsky.embed.recordWithMedia#view" ?
                                            data?.post?.embed?.media?.$type === "app.bsky.embed.images#view" ?
                                                <>
                                                    <ImageEmbed images={data.post.embed.media.images} />
                                                    <ViewRecord record={data.post.embed.record.record} />
                                                </>
                                                : "" : ""
                                        }

                                        {data?.post?.embed?.$type === "app.bsky.embed.images#view" ?
                                            <ImageEmbed images={data.post.embed.images} /> : ""}

                                        {data?.post?.embed?.$type === "app.bsky.embed.external#view" ?
                                            <ExternalView embed={data.post.embed} /> : ""}

                                    </div>

                                    {/* This should be moved to a separate component */}
                                    <div className="flex flex-row justify-between w-11/12 mx-auto pb-4">
                                        <a href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Likes height="25px" width="25px" /><span className="self-center ml-2">{data.post.likeCount}</span></a>
                                        <a href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Reposted height="25px" width="25px" /><span className="self-center ml-2">{data.post.repostCount + data.post.quoteCount}</span></a>
                                        <a href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Comments height="25px" width="25px" /><span className="self-center ml-2">{data.post.replyCount}</span></a>
                                    </div>

                                    <div className="py-3 px-5 w-full">
                                        <a href={postLink} className="bg-brand block text-center hover:shadow-medium w-full transition-shadow duration-200 text-white font-bold text-lg py-2 px-4 rounded">
                                            View post on BlueSky
                                        </a>
                                    </div>
                                </div>
                            </article>
                        )
                    }
                    )}
            </div>
        </section>
    );
}
const getAuthorFeed = async () => {
    const res = await fetch(
        BSKY_AUTHOR_FEED,
        {
            method: 'GET',
            headers: {
                "Accept": "application/json",
            },
            cache: "no-store",
        },
    );

    if (!res.ok) {
        console.error(await res.text());
        throw new Error("Failed to fetch post");
    }

    const data = (await res.json()) as AppBskyFeedGetAuthorFeed.OutputSchema;
    return data;
}

// components/ImageEmbed.js
const ImageEmbed = ({ images }) => {
    const hasMultiImages = images.length > 1;
    return (
        <div className={hasMultiImages ? "grid grid-cols-2 gap-2 py-3 row-auto" : "py-3"}>
            {images.map((image, index) => (
                <img className="rounded-2xl" key={index} src={image.thumb} alt={`image-${index}`} />
            ))}
        </div>
    );
};

const ExternalView = ({ embed }) => {
    return (
        <div className=" rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200m my-2">
            <a href={embed.external.uri}>
                <img className="rounded-t-2xl" src={embed.external.thumb} />
                <div className="px-2 pb-3 border-x border-b rounded-b-2xl">
                    <p className="text-md font-bold">{embed.external.title}</p>
                    <p className="text-sm pb-1">{embed.external.description}</p>
                    <hr className="pb-1" />
                    <p className="text-sm">{embed.external.uri.split("/")[2]}</p>
                </div>
            </a>
        </div>
    )
}

const ViewRecord = ({ record }) => {
    const date = new Date(record.value.createdAt);
    const currentDate = new Date();
    console.log(date)
    const daysAgo = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const renderTimeFromPost = daysAgo === 0 ?
        "Today" :
        daysAgo >= 7 ?
            `${daysAgo % 7} weeks ago` :
            `${daysAgo} days ago`;
    const postLink = `https://bsky.app/profile/${record.author.handle}/post/${record.uri.split("/")[4]}`;
    return (
        <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 border">
            <a href={postLink} className="mb-0 backdrop-blur-xl rounded-2xl">

                {/* This should be moved to a separate component */}
                <div className="pb-4"></div>
                <div className="flex flex-row justify-between">
                    <div className="flex gap-4 gap-y-4 rounded-2xl">
                        <img className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5" src={record.author.avatar} />
                        <p className="line-clamp-1 text-lg self-center flex flex-col">
                            {record?.author?.displayName ?? record?.post?.author?.handle}{" "}
                            <span className="text-gray-500 text-md">@{record.author.handle}</span>
                        </p>
                    </div>
                    <p className="self-center mr-5 text-sm">{renderTimeFromPost}
                    </p>
                </div>
                {/* This should be moved to a separate component */}
                <div className="py-3 px-5">
                    <p className="text-lg">{record.value.text}</p>

                    {/* {record?.$type === "app.bsky.embed.recordWithMedia#view" ?
          record?.embed?.media?.$type === "app.bsky.embed.images#view" ?
            <>
              <ImageEmbed images={data.post.embed.media.images} />
              <ViewRecord record={data.post.embed.record.record} />
            </>
            : "" : ""
        } */}

                    {record?.embeds[0].$type === "app.bsky.embed.images#view" ?
                        <ImageEmbed images={record?.embeds[0].images} /> : ""}

                    {record?.embeds[0].$type === "app.bsky.embed.external#view" ?
                        <ExternalView embed={record?.embeds[0]} /> : ""}

                </div>

            </a>
        </div>

    )
}




