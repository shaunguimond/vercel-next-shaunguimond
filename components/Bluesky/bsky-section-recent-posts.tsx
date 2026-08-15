'use client';

import {
    AppBskyEmbedExternal,
    AppBskyEmbedImages,
    AppBskyEmbedRecord,
    AppBskyEmbedRecordWithMedia,
    AppBskyFeedDefs,
    AppBskyFeedGetAuthorFeed,
    AppBskyRichtextFacet,
} from "@atproto/api";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BSKY_AUTHOR_FEED } from "../../lib/constants";
import { Reposted, Likes, Comments } from "../../lib/icons";
import sanitizeHtml from 'sanitize-html';
import React from 'react';
import { useTheme } from 'next-themes';

export default function BskySectionRecentPosts() {
    const [feedData, setFeedData] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [feedError, setFeedError] = useState(false);
    const { systemTheme, theme } = useTheme();

    const currentTheme = theme === "system" ? systemTheme : theme;
    const fillColor = currentTheme === "dark" ? "white" : "black";

    useEffect(() => {
        const controller = new AbortController();
        getAuthorFeed(controller.signal)
            .then(data => setFeedData(data.feed))
            .catch(() => setFeedError(true));
        return () => controller.abort();
    }, []);

    return (
        <section className='mx-1'>
            <h1 className="font-bold text-3xl my-8 text-center">Posts from Bluesky</h1>
            <div className="columns-1 sm:columns-2 gap-6 mb-32">
                {feedError && (
                    <p className="text-center text-gray-500">Could not load posts from Bluesky.</p>
                )}
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
                                                <div className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5 relative">
                                                    {data.post.author.avatar && (
                                                        <Image src={data.post.author.avatar} alt="" fill className="rounded-full" />
                                                    )}
                                                </div>
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


                                        {AppBskyEmbedRecordWithMedia.isView(data?.post?.embed) ?
                                            AppBskyEmbedImages.isView(data.post.embed.media) ?
                                                <>
                                                    <ImageEmbed images={data.post.embed.media.images} />
                                                    <ViewRecord record={data.post.embed.record.record} />
                                                </>
                                                : "" : ""
                                        }

                                        {AppBskyEmbedRecord.isView(data?.post?.embed) ?
                                            <ViewRecord record={data.post.embed.record} /> : ""}

                                        {AppBskyEmbedImages.isView(data?.post?.embed) ?
                                            <ImageEmbed images={data.post.embed.images} /> : ""}

                                        {AppBskyEmbedExternal.isView(data?.post?.embed) ?
                                            <ExternalView embed={data.post.embed} /> : ""}


                                        {/* This should be moved to a separate component */}
                                        <div className="flex flex-row justify-between w-11/12 mx-auto pb-4">
                                            <a target="_blank" href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Likes height="25px" width="25px" color={fillColor} /><span className="self-center ml-2">{data.post.likeCount}</span></a>
                                            <a target="_blank" href={postLink} className="flex flex-row hover:shadow-medium transition-shadow duration-200"><Reposted height="25px" width="25px" color={fillColor} /><span className="self-center ml-2">{(data.post.repostCount ?? 0) + (data.post.quoteCount ?? 0)}</span></a>
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
const getAuthorFeed = async (signal?: AbortSignal) => {
    const res = await fetch(
        BSKY_AUTHOR_FEED,
        {
            method: 'GET',
            headers: {
                "Accept": "application/json",
            },
            cache: "no-store",
            signal,
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
    const safeImages = Array.isArray(images) ? images : [];
    const hasMultiImages = safeImages.length > 1;
    return (
        <div className={hasMultiImages ? "grid grid-cols-2 gap-2 mb-5" : "mb-5"}>
            {safeImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                    <Image
                        src={image.thumb}
                        alt={`image-${index}`}
                        fill
                        className="rounded-2xl object-cover"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                </div>
            ))}
        </div>
    );
};

const ExternalView = ({ embed }) => {
    const hasThumbnail = embed.external.thumb;
    return (
        <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 my-5">
            <a target="_blank" href={embed.external.uri}>
                {/* Raw <img> on purpose: external thumbnails can point at any
                    third-party host, and next/image would need a wildcard
                    remotePattern (open image proxy) to handle those. */}
                <img className="rounded-t-2xl" loading="lazy" src={embed.external.thumb} alt="" />
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
    // Some embedded records may not resolve to a full record view.
    if (!record?.value || !record?.author) return null;

    const embeds = Array.isArray(record?.embeds) ? record.embeds : [];
    const firstEmbed = embeds[0];
    const renderTimeFromPost = getRenderTimeFromPost(record.value.createdAt)
    // const postLink = `https://bsky.app/profile/${record.author.handle}/post/${record.uri.split("/")[4]}`;
    const handleLink = `https://bsky.app/profile/${record.author.handle}`;

    const formattedContent = getFormattedTextForRecord(record);
    return (
        <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 border mb-5">

            {/* This should be moved to a separate component */}
            <div className="pb-4"></div>
            <div className="flex flex-row justify-between">
                <div className="flex gap-4 gap-y-4 rounded-2xl">
                    <a target="_blank" href={handleLink}>
                        <div className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5 relative">
                            {record.author.avatar && (
                                <Image src={record.author.avatar} alt="" fill className="rounded-full" />
                            )}
                        </div>
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

                {firstEmbed?.$type === "app.bsky.embed.images#view" ?
                    <ImageEmbed images={firstEmbed?.images} /> : ""}

                {firstEmbed?.$type === "app.bsky.embed.external#view" ?
                    <ExternalView embed={firstEmbed} /> : ""}

            </div>
        </div>

    )
}


// Bluesky rich text formatting.
//
// Facet link URIs are attacker-influenced (anyone can link to anything from
// Bluesky). The raw post text is HTML-escaped before any anchor is spliced
// in, so post text can never be interpreted as HTML. Link URIs are
// restricted to http(s) before wrapping. The combined string still runs
// through sanitize-html, which enforces the tag/attribute/class/scheme
// allowlist as a second layer.

const BLUESKY_TEXT_SANITIZE_OPTIONS = {
    allowedTags: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'class'],
    },
    allowedClasses: {
        a: ['underline'],
    },
    allowedSchemes: ['http', 'https'],
};

// Only http(s) link URIs are allowed. Everything else is dropped.
function isSafeLinkUri(uri: string): boolean {
    try {
        const url = new URL(uri);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Facet indices are UTF-8 byte offsets. Convert one to a JavaScript string
// index (UTF-16 code units). JS slice indices only match byte offsets for
// pure ASCII text, so this mapping is required for non-ASCII posts.
function byteOffsetToCodeUnitIndex(text: string, byteOffset: number): number {
    let bytes = 0;
    for (let i = 0; i < text.length; ) {
        const code = text.codePointAt(i) ?? 0;
        const byteLength = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
        if (bytes + byteLength > byteOffset) return i;
        bytes += byteLength;
        i += code > 0xffff ? 2 : 1;
    }
    return text.length;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const LINK_OPEN_TAG = (uri: string) =>
    `<a class="underline" href="${escapeHtml(uri)}" target="_blank" rel="noopener noreferrer">`;

// Escapes the post text and wraps each link facet range in an <a> tag.
// The character walk keeps the escaped text and the spliced anchors aligned
// even for non-ASCII text and for posts with multiple links.
function wrapFacetLinks(text: string, facets?: AppBskyRichtextFacet.Main[]): string {
    const linkByIndex: (string | null)[] = new Array(text.length).fill(null);
    for (const facet of facets ?? []) {
        const link = facet.features.find(AppBskyRichtextFacet.isLink);
        if (!link || !isSafeLinkUri(link.uri)) continue;
        const start = byteOffsetToCodeUnitIndex(text, facet.index.byteStart);
        const end = byteOffsetToCodeUnitIndex(text, facet.index.byteEnd);
        for (let i = start; i < end && i < text.length; i++) {
            linkByIndex[i] = link.uri;
        }
    }

    let out = '';
    let currentUri: string | null = null;
    for (let i = 0; i < text.length; i++) {
        const uri = linkByIndex[i];
        if (uri !== currentUri) {
            if (currentUri !== null) out += '</a>';
            if (uri !== null) out += LINK_OPEN_TAG(uri);
            currentUri = uri;
        }
        out += escapeHtml(text[i]);
    }
    if (currentUri !== null) out += '</a>';
    return out;
}

function formatPostText(text: string | undefined, facets?: AppBskyRichtextFacet.Main[]): string {
    const withLinks = wrapFacetLinks(text ?? '', facets);
    const withLineBreaks = withLinks.replace(/\n/g, '<br>');
    return sanitizeHtml(withLineBreaks, BLUESKY_TEXT_SANITIZE_OPTIONS);
}

function getFormattedText(post) {
    return formatPostText(post.record?.text, post.record?.facets);
}

function getFormattedTextForRecord(record) {
    return formatPostText(record?.value?.text, record?.value?.facets);
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
