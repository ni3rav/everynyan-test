"use client"

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Post as PostType } from "@/lib/models";
import { LoadingPost, CaughtUp } from "@/components/LoadingPost";
import PostComponent from "@/components/Posts/Post";
import { PaginatedResult } from "@/lib/firebase/posts";
import { useToast } from "@/hooks/use-toast";
import { SortDropdown } from "@/components/SortDropdown";

interface InfiniteScrollingPostsProps {
  boardName: string | null;
  data: string;
}

const sortByFields = [
  {
    title: "Latest",
    value: "timestamp"
  },
  {
    title: "Popular",
    value: "upvotes"
  },
  {
    title: "Controversial",
    value: "downvotes"
  },
  {
    title: "Most commented",
    value: "comment_count"
  }
];

export function InfiniteScrollingPosts({ boardName, data }: InfiniteScrollingPostsProps) {
  const dataObj = JSON.parse(data);
  const [posts, setPosts] = useState<PostType[]>(dataObj.items);
  const [lastDocID, setLastDocID] = useState<string | null>(dataObj.lastDocID);
  const [hasMore, setHasMore] = useState(dataObj.hasMore);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const { toast } = useToast();

  const { ref, inView } = useInView();

  const fetchMore = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    console.log("Fetching more posts...");

    setLoading(true);
    try {
      const resp = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board: boardName,
          lastDocID: reset ? null : lastDocID,
          limitTo: 10,
          orderByField: sortBy,
        }),
      });

      const result: PaginatedResult<PostType> & { error: string } = await resp.json();
      if (resp.status !== 200) {
        throw new Error(result.error);
      }

      setPosts((prev) => reset ? result.items : [...prev, ...result.items]);
      setLastDocID(result.lastDocID);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setHasMore(false);
      toast({ 
        title: "Post fetching failed", 
        description: String(error), 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading) {
      fetchMore();
    }
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPosts([]);
    setLastDocID(null);
    setHasMore(true);
    fetchMore(true);
  };

  return (
    <>
      <div className="mb-4">
        <SortDropdown
          options={sortByFields}
          value={sortBy}
          onValueChange={handleSortChange}
        />
      </div>
      {posts.length === 0 && !loading ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold text-primary">No posts yet!</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to create a post in this board
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostComponent
            key={`${post.id}`}
            title={post.title}
            body={post.body}
            board={post.board}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            id={post.id}
            moderation_status={post.moderation_status}
            comment_count={post.comment_count}
          />
        ))
      )}

      {loading && <LoadingPost />}
      {!hasMore && posts.length > 0 && <CaughtUp />}
      <div ref={ref} className="h-10" />
    </>
  );
}
