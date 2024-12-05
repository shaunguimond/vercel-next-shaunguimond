'use client';

import { AppBskyFeedGetAuthorFeed } from "@atproto/api";
import { useEffect, useState } from 'react';
import { BSKY_AUTHOR_FEED } from "../../lib/constants";
import { Reposted, Likes, Comments } from "../../lib/icons";
import sanitizeHtml from 'sanitize-html';
import React from 'react';
import { useTheme } from 'next-themes';

export default function BskySectionRecentPosts() {
    const [feedData, setFeedData] = useState([]);
    const { systemTheme, theme } = useTheme();

    const currentTheme = theme === "system" ? systemTheme : theme;
    const fillColor = currentTheme === "dark" ? "white" : "black";

    useEffect(() => {
        getAuthorFeed().then(data => setFeedData(data.feed));
    }, []);

    return (
        <section className='mx-1'>
            <h1 className="font-bold text-3xl my-8 text-center">Posts from Bluesky</h1>
            <div className="masonry sm:masonry-sm mb-32">
                {feedData.length > 0 &&
                    feedData.map((data, index) => {
                        const renderTimeFromPost = getRenderTimeFromPost(data.post.record.createdAt)
                        const isReposted = data.reason !== undefined && data.reason.$type === "app.bsky.feed.defs#reasonRepost";
                        const postLink = `https://bsky.app/profile/${data.post.author.handle}/post/${data.post.uri.split("/")[4]}`;
                        const handleLink = `https://bsky.app/profile/${data.post.author.handle}`;
                        const formattedContent = getFormattedText(data.post);

                        return (
                            <article key={index} className="break-inside mb-5 shadow-small rounded-2xl h-fit bg-sg-multicolour hover:shadow-medium transition-shadow duration-200">
                                <div className="mb-0 backdrop-blur-xl rounded-2xl">

                                    {/* This should be moved to a separate component */}
                                    <div className="pb-4"></div>
                                    {isReposted ? <span className="flex flex-row ml-20 mt-0 items-center gap-2"> <Reposted height="16px" width="16px" color={fillColor} /> Reposted by me</span> : ""}
                                    <div className="flex flex-row justify-between">
                                        <div className="flex gap-4 gap-y-4 rounded-2xl">
                                            <a target="_blank" href={handleLink}>
                                                <img className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5" src={data.post.author.avatar} />
                                            </a>
                                            <p className="line-clamp-1 text-lg font-bold self-center flex flex-col">
                                                {data.post.author.displayName ?? data.post.author.handle}{" "}
                                                <a target="_blank" href={handleLink} className="text-gray-700 dark:text-gray-300 font-bold text-sm hover:underline">@{data.post.author.handle}</a>
                                            </p>
                                        </div>
                                        <p className="self-center mr-5 text-sm">{renderTimeFromPost}
                                        </p>
                                    </div>

                                    {/* This should be moved to a separate component */}
                                    <div className="py-3 px-5">
                                        <p className="text-lg mb-5" dangerouslySetInnerHTML={{ __html: formattedContent }}></p>


                                        {data?.post?.embed?.$type === "app.bsky.embed.recordWithMedia#view" ?
                                            data?.post?.embed?.media?.$type === "app.bsky.embed.images#view" ?
                                                <>
                                                    <ImageEmbed images={data.post.embed.media.images} />
                                                    <ViewRecord record={data.post.embed.record.record} />
                                                </>
                                                : "" : ""
                                        }

                                        {data?.post?.embed?.$type === "app.bsky.embed.record#view" ?
                                            <ViewRecord record={data.post.embed.record} /> : ""}

                                        {data?.post?.embed?.$type === "app.bsky.embed.images#view" ?
                                            <ImageEmbed images={data.post.embed.images} /> : ""}

                                        {data?.post?.embed?.$type === "app.bsky.embed.external#view" ?
                                            <ExternalView embed={data.post.embed} /> : ""}


                                        {/* This should be moved to a separate component */}
                                        <div className="flex flex-row justify-between w-11/12 mx-auto pb-4">
                                            <a target="_blank" href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Likes height="25px" width="25px" color={fillColor} /><span className="self-center ml-2">{data.post.likeCount}</span></a>
                                            <a target="_blank" href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Reposted height="25px" width="25px" color={fillColor} /><span className="self-center ml-2">{data.post.repostCount + data.post.quoteCount}</span></a>
                                            <a target="_blank" href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Comments height="25px" width="25px" color={fillColor} /><span className="self-center ml-2">{data.post.replyCount}</span></a>
                                        </div>

                                        <div className="py-3 px-5 w-full">
                                            <a target="_blank" href={postLink} className="bg-brand block text-center hover:shadow-medium w-full transition-shadow duration-200 text-white font-bold text-lg py-2 px-4 rounded">
                                                View post on BlueSky
                                            </a>
                                        </div>
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
        <div className={hasMultiImages ? "grid grid-cols-2 gap-2 row-auto mb-5" : "mb-5"}>
            {images.map((image, index) => (
                <img className="rounded-2xl w-full max-h-600 h-content object-cover" key={index} src={image.thumb} alt={`image-${index}`} />
            ))}
        </div>
    );
};

const ExternalView = ({ embed }) => {
    const hasThumbnail = embed.external.thumb;
    return (
        <div className=" rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200m my-5">
            <a target="_blank" href={embed.external.uri}>
                <img className="rounded-t-2xl" src={embed.external.thumb} />
                <div className={hasThumbnail ? "px-2 pb-3 border-x border-b rounded-b-2xl" : "px-2 py-2 border-x border-y rounded-2xl"}>
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
    const renderTimeFromPost = getRenderTimeFromPost(record.value.createdAt)
    // const postLink = `https://bsky.app/profile/${record.author.handle}/post/${record.uri.split("/")[4]}`;
    const handleLink = `https://bsky.app/profile/${record.author.handle}`;

    const formattedContent = getFormattedTextForRecord(record);
    return (
        <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 border mb-5">
            {/* <a target="_blank" href={postLink} className="mb-0 backdrop-blur-xl rounded-2xl"> */}

            {/* This should be moved to a separate component */}
            <div className="pb-4"></div>
            <div className="flex flex-row justify-between">
                <div className="flex gap-4 gap-y-4 rounded-2xl">
                    <a target="_blank" href={handleLink}>
                        <img className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5" src={record.author.avatar} />
                    </a>
                    <p className="line-clamp-1 text-lg self-center flex flex-col">
                        {record?.author?.displayName ?? record?.post?.author?.handle}{" "}
                        <a target="_blank" href={handleLink} className="text-gray-700 dark:text-gray-300 font-bold text-sm hover:underline">@{record.author.handle}</a>
                    </p>
                </div>
                <p className="self-center mr-5 text-sm">{renderTimeFromPost}
                </p>
            </div>
            {/* This should be moved to a separate component */}
            <div className="py-3 px-5">
                <p className="text-lg" dangerouslySetInnerHTML={{ __html: formattedContent }}></p>

                {record?.embeds[0].$type === "app.bsky.embed.images#view" ?
                    <ImageEmbed images={record?.embeds[0].images} /> : ""}

                {record?.embeds[0].$type === "app.bsky.embed.external#view" ?
                    <ExternalView embed={record?.embeds[0]} /> : ""}

            </div>

            {/* </a> */}
        </div>

    )
}


function getFormattedText(post) {
    let sanitizedContent = sanitizeHtml(post.record.text, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'], // Allowed HTML tags
        allowedAttributes: {
            'a': ['href']
        }

    });

    if (post.record?.facets !== undefined) {
        post.record?.facets.map((facet, index) => {
            facet.features.map((feature, index) => {
                if (feature.$type === "app.bsky.richtext.facet#link") {
                    const byteStart = facet.index.byteStart;
                    const byteEnd = facet.index.byteEnd;
                    const externalLink = `<a style="text-decoration: underline;" href="${feature.uri}" target="_blank" >`;

                    sanitizedContent = sanitizedContent.slice(0, byteStart) + externalLink + sanitizedContent.slice(byteStart, byteEnd) + '</a>' + sanitizedContent.slice(byteEnd);

                }
            })
        })
    }
    const formattedContent = sanitizedContent.replace(/\n/g, '<br>');

    return formattedContent
}

function getFormattedTextForRecord(record) {
    let sanitizedContent = sanitizeHtml(record.value.text, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'], // Allowed HTML tags
        allowedAttributes: {
            'a': ['href']
        }

    });

    if (record?.value?.facets !== undefined) {
        record?.value?.facets.map((facet, index) => {
            facet.features.map((feature, index) => {
                if (feature.$type === "app.bsky.richtext.facet#link") {
                    const byteStart = facet.index.byteStart;
                    const byteEnd = facet.index.byteEnd;
                    const externalLink = `<a style="text-decoration: underline;" href="${feature.uri}" target="_blank" >`;

                    sanitizedContent = sanitizedContent.slice(0, byteStart) + externalLink + sanitizedContent.slice(byteStart, byteEnd) + '</a>' + sanitizedContent.slice(byteEnd);

                }
            })
        })
    }
    const formattedContent = sanitizedContent.replace(/\n/g, '<br>');

    return formattedContent
}


function getRenderTimeFromPost(date) {
    const postDate = new Date(date);
    const currentDate = new Date();
    const daysAgo = Math.floor((currentDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysAgo === 0) {
        const hoursAgo = Math.floor((currentDate.getTime() - postDate.getTime()) / (1000 * 60 * 60));
        if (hoursAgo === 0) {
            const minutesAgo = Math.floor((currentDate.getTime() - postDate.getTime()) / (1000 * 60));
            return `${minutesAgo} minutes ago`;
        } else {
            return `${hoursAgo} hours ago`;
        }

    } else if (daysAgo < 10) {
        return `${daysAgo} days ago`;

    } else if (daysAgo < 365) {
        return `${Math.floor(daysAgo / 7)} weeks ago`;

    } else {
        return `${Math.floor(daysAgo / 365)} years ago`;
    }
}
