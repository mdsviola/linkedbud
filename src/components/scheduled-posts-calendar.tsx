"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LabelWithCount } from "@/components/ui/label-with-count";
import { truncateContent } from "@/lib/utils";
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface PostVariant {
  hook: string;
  body: string;
}

interface Post {
  id: number;
  two_para_summary: string;
  content: string;
  draft_variants: PostVariant[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_publish_date: string | null;
  published_at: string | null;
  published_variant_index: number | null;
  created_at: string;
  publish_target: string | null;
  topics?: {
    title: string;
  };
  linkedin_posts?: {
    linkedin_post_id: string;
    status: string;
    published_at: string;
    organization_id: string | null;
  }[];
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Post;
  color?: string;
  dayPosts?: Post[];
  postType?: string;
  postStatus?: "published" | "scheduled";
}

interface DayPosts {
  date: string;
  posts: Post[];
  count: number;
  postType?: string;
}

interface ScheduledPostsCalendarProps {
  posts: Post[];
  loading?: boolean;
  onPostClick?: (post: Post) => void;
  organizations?: Record<string, string>;
  onMonthChange?: (year: number, month: number) => void;
  currentMonth?: string; // Track current month from parent
}

const localizer = momentLocalizer(moment);

export function ScheduledPostsCalendar({
  posts,
  loading = false,
  onPostClick,
  organizations = {},
  onMonthChange,
  currentMonth,
}: ScheduledPostsCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedDayPosts, setSelectedDayPosts] = useState<DayPosts | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [visibleDate, setVisibleDate] = useState<Date>(new Date());
  const hasAutoSelectedRef = useRef(false);

  // Calculate dynamic height based on number of weeks in the month
  const calendarHeight = useMemo(() => {
    const year = visibleDate.getFullYear();
    const month = visibleDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const daysInMonth = lastDay.getDate();

    // Calculate number of weeks needed
    const daysInFirstWeek = 7 - firstDayOfWeek;
    const remainingDays = daysInMonth - daysInFirstWeek;
    const additionalWeeks = Math.ceil(remainingDays / 7);
    const totalWeeks = 1 + additionalWeeks; // First week + additional weeks

    // Toolbar height (~80px) + header row (~40px) + week rows (120px each)
    const toolbarHeight = 80;
    const headerHeight = 40;
    const rowHeight = 120;
    return toolbarHeight + headerHeight + totalWeeks * rowHeight + 20; // +20 for padding
  }, [visibleDate]);

  // Sync visible month with parent-provided currentMonth (formats like 'YYYY-M' or 'YYYY-MM')
  useEffect(() => {
    if (!currentMonth) return;
    const [yStr, mStr] = currentMonth.split("-");
    const y = Number(yStr);
    const m = Number(mStr); // 1-based
    if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 1 && m <= 12) {
      const nextDate = new Date(y, m - 1, 1);
      setVisibleDate(nextDate);
    }
  }, [currentMonth]);

  // Color palette for organizations
  const organizationColors = [
    "hsl(142 76% 36%)",
    "hsl(262 83% 58%)",
    "hsl(24 95% 53%)",
    "hsl(201 96% 32%)",
    "hsl(330 81% 60%)",
    "hsl(47 96% 53%)",
    "hsl(0 84% 60%)",
    "hsl(280 100% 70%)",
    "hsl(160 84% 39%)",
    "hsl(38 92% 50%)",
  ];

  const getOrganizationColor = (organizationId: string) => {
    const orgIds = Object.keys(organizations);
    const index = orgIds.indexOf(organizationId);
    return organizationColors[index % organizationColors.length];
  };

  // Group posts by day and create events
  const events: CalendarEvent[] = useMemo(() => {
    const postsByDay: Record<string, Post[]> = {};

    // Group posts by date - handle both scheduled and published posts
    posts.forEach((post) => {
      let postDate: Date | null = null;
      let dateKey: string | null = null;

      // For SCHEDULED posts, use scheduled_publish_date
      if (post.status === "SCHEDULED" && post.scheduled_publish_date) {
        postDate = new Date(post.scheduled_publish_date);
        dateKey = postDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      }
      // For PUBLISHED posts, use published_at
      else if (post.status === "PUBLISHED" && post.published_at) {
        postDate = new Date(post.published_at);
        dateKey = postDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      }

      if (dateKey && postDate) {
        if (!postsByDay[dateKey]) {
          postsByDay[dateKey] = [];
        }
        postsByDay[dateKey].push(post);
      }
    });

    // Create events for each day with posts, grouped by type
    const events: CalendarEvent[] = [];

    Object.entries(postsByDay).forEach(([dateKey, dayPosts]) => {
      const scheduledDate = new Date(dateKey);

      // Group posts by type (personal vs organization) and status (SCHEDULED vs PUBLISHED)
      const postsByTypeAndStatus: Record<string, Post[]> = {};

      dayPosts.forEach((post) => {
        let orgId =
          post.linkedin_posts?.find((lp) => lp.organization_id)
            ?.organization_id || null;
        if (
          !orgId &&
          post.publish_target &&
          post.publish_target !== "personal"
        ) {
          orgId = post.publish_target;
        }

        const isPersonal =
          post.publish_target === "personal" ||
          post.linkedin_posts?.some((lp) => lp.organization_id === null);

        const typeKey = isPersonal ? "personal" : orgId || "default";
        const statusKey =
          post.status === "PUBLISHED" ? "published" : "scheduled";
        const combinedKey = `${typeKey}-${statusKey}`;

        if (!postsByTypeAndStatus[combinedKey]) {
          postsByTypeAndStatus[combinedKey] = [];
        }
        postsByTypeAndStatus[combinedKey].push(post);
      });

      // Create separate events for each post type and status
      Object.entries(postsByTypeAndStatus).forEach(
        ([combinedKey, typePosts], index) => {
          const [typeKey, statusKey] = combinedKey.split("-");
          const isPersonal = typeKey === "personal";
          const isPublished = statusKey === "published";
          const orgId = isPersonal ? null : typeKey;

          // Use the same color for both scheduled and published posts
          // Published posts will be visually distinguished by the icon
          const baseColor = isPersonal
            ? "hsl(var(--primary))"
            : orgId
            ? getOrganizationColor(orgId)
            : "hsl(142 76% 36%)";

          // For published posts, we can optionally use a slightly muted version
          // But keeping the same color to show organization/personal association
          let color: string = baseColor;

          events.push({
            id: parseInt(dateKey.replace(/-/g, "")) + index * 100, // Unique ID per type
            title: `${typePosts.length} post${typePosts.length > 1 ? "s" : ""}`,
            start: scheduledDate,
            end: scheduledDate,
            resource: typePosts[0],
            color,
            dayPosts: typePosts,
            postType: typeKey,
            postStatus: isPublished ? "published" : "scheduled",
          });
        }
      );
    });

    return events;
  }, [posts, organizations]);

  // Handle month changes
  const handleNavigate = useCallback(
    (date: Date) => {
      // Always update our visibleDate first so the calendar view changes immediately
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const normalized = new Date(year, month - 1, 1);
      setVisibleDate(normalized);

      // Clear selected day when navigating to a different month
      setSelectedDay(null);
      setSelectedDayPosts(null);
      setSelectedRange(null);
      setSelectedEvent(null);

      if (onMonthChange) {
        const monthKey = `${year}-${month}`;

        if (currentMonth !== monthKey) {
          onMonthChange(year, month);
        }
      }
    },
    [onMonthChange, currentMonth]
  );

  // Get all posts for a specific day
  const getPostsForDay = useCallback(
    (date: Date) => {
      // Create a consistent date comparison by using local date components
      const targetYear = date.getFullYear();
      const targetMonth = date.getMonth();
      const targetDate = date.getDate();

      return posts.filter((post) => {
        let postDate: Date | null = null;

        // For SCHEDULED posts, use scheduled_publish_date
        if (post.status === "SCHEDULED" && post.scheduled_publish_date) {
          postDate = new Date(post.scheduled_publish_date);
        }
        // For PUBLISHED posts, use published_at
        else if (post.status === "PUBLISHED" && post.published_at) {
          postDate = new Date(post.published_at);
        }

        if (!postDate) return false;

        // Compare using local date components to avoid timezone issues
        return (
          postDate.getFullYear() === targetYear &&
          postDate.getMonth() === targetMonth &&
          postDate.getDate() === targetDate
        );
      });
    },
    [posts]
  );

  // Auto-select today's date on initial load if there are posts for today
  useEffect(() => {
    // Only auto-select once on initial load when posts are first available
    if (hasAutoSelectedRef.current || posts.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = getPostsForDay(today);

    if (todayPosts.length > 0) {
      // Mark that we've done the auto-select
      hasAutoSelectedRef.current = true;

      // Group posts by type for display
      const postsByType: Record<string, Post[]> = {};

      todayPosts.forEach((post) => {
        let orgId =
          post.linkedin_posts?.find((lp) => lp.organization_id)
            ?.organization_id || null;
        if (
          !orgId &&
          post.publish_target &&
          post.publish_target !== "personal"
        ) {
          orgId = post.publish_target;
        }

        const isPersonal =
          post.publish_target === "personal" ||
          post.linkedin_posts?.some((lp) => lp.organization_id === null);

        const typeKey = isPersonal ? "personal" : orgId || "default";

        if (!postsByType[typeKey]) {
          postsByType[typeKey] = [];
        }
        postsByType[typeKey].push(post);
      });

      // Set the selected day and range for visual feedback
      setSelectedDay(today);
      setSelectedRange({
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        end: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59
        ),
      });

      // Create a combined day posts object with all posts
      setSelectedDayPosts({
        date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(today.getDate()).padStart(2, "0")}`,
        posts: todayPosts,
        count: todayPosts.length,
        postType:
          Object.keys(postsByType).length > 1
            ? "mixed"
            : Object.keys(postsByType)[0],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, getPostsForDay]);

  // Handle day selection (clicking on empty day cells)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
      const clickedDate = slotInfo.start;
      const dayPosts = getPostsForDay(clickedDate);

      // Set the selected day and range for visual feedback
      setSelectedDay(clickedDate);
      setSelectedRange({
        start: new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate()
        ),
        end: new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate(),
          23,
          59,
          59
        ),
      });

      if (dayPosts.length > 0) {
        // Group posts by type for display
        const postsByType: Record<string, Post[]> = {};

        dayPosts.forEach((post) => {
          let orgId =
            post.linkedin_posts?.find((lp) => lp.organization_id)
              ?.organization_id || null;
          if (
            !orgId &&
            post.publish_target &&
            post.publish_target !== "personal"
          ) {
            orgId = post.publish_target;
          }

          const isPersonal =
            post.publish_target === "personal" ||
            post.linkedin_posts?.some((lp) => lp.organization_id === null);

          const typeKey = isPersonal ? "personal" : orgId || "default";

          if (!postsByType[typeKey]) {
            postsByType[typeKey] = [];
          }
          postsByType[typeKey].push(post);
        });

        // Create a combined day posts object with all posts
        setSelectedDayPosts({
          date: `${clickedDate.getFullYear()}-${String(
            clickedDate.getMonth() + 1
          ).padStart(2, "0")}-${String(clickedDate.getDate()).padStart(
            2,
            "0"
          )}`,
          posts: dayPosts,
          count: dayPosts.length,
          postType:
            Object.keys(postsByType).length > 1
              ? "mixed"
              : Object.keys(postsByType)[0],
        });
        setSelectedEvent(null); // Clear individual event selection
      } else {
        // No posts for this day, clear selections
        setSelectedDayPosts(null);
        setSelectedEvent(null);
      }
    },
    [getPostsForDay]
  );

  // Handle event selection - always select the day and show all posts for that day
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      const clickedDate = event.start;
      const dayPosts = getPostsForDay(clickedDate);

      // Always show all posts for the day, never show individual post
      if (dayPosts.length > 0) {
        // Group posts by type for display
        const postsByType: Record<string, Post[]> = {};

        dayPosts.forEach((post) => {
          let orgId =
            post.linkedin_posts?.find((lp) => lp.organization_id)
              ?.organization_id || null;
          if (
            !orgId &&
            post.publish_target &&
            post.publish_target !== "personal"
          ) {
            orgId = post.publish_target;
          }

          const isPersonal =
            post.publish_target === "personal" ||
            post.linkedin_posts?.some((lp) => lp.organization_id === null);

          const typeKey = isPersonal ? "personal" : orgId || "default";

          if (!postsByType[typeKey]) {
            postsByType[typeKey] = [];
          }
          postsByType[typeKey].push(post);
        });

        // Create a combined day posts object with all posts
        setSelectedDayPosts({
          date: `${clickedDate.getFullYear()}-${String(
            clickedDate.getMonth() + 1
          ).padStart(2, "0")}-${String(clickedDate.getDate()).padStart(
            2,
            "0"
          )}`,
          posts: dayPosts,
          count: dayPosts.length,
          postType:
            Object.keys(postsByType).length > 1
              ? "mixed"
              : Object.keys(postsByType)[0],
        });
      } else {
        // No posts for this day, clear selections
        setSelectedDayPosts(null);
      }

      // Always clear individual event selection and select the day
      setSelectedEvent(null);
      setSelectedDay(clickedDate);
      setSelectedRange({
        start: new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate()
        ),
        end: new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate(),
          23,
          59,
          59
        ),
      });
    },
    [getPostsForDay]
  );

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const postCount = event.dayPosts?.length || 1;
    const isPublished = event.postStatus === "published";

    return (
      <div
        className="rbc-event-content"
        style={{ backgroundColor: event.color }}
        onClick={() => handleSelectEvent(event)}
      >
        {isPublished && (
          <CheckCircle2 className="h-3 w-3 text-white flex-shrink-0" />
        )}
        <span className="text-xs font-bold text-white whitespace-nowrap">
          {postCount} post{postCount > 1 ? "s" : ""}
        </span>
      </div>
    );
  };

  // Shared handler for day selection
  const handleDaySelection = useCallback(
    (date: Date) => {
      const dayPosts = getPostsForDay(date);

      // Set the selected day and range for visual feedback
      setSelectedDay(date);
      setSelectedRange({
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59
        ),
      });

      if (dayPosts.length > 0) {
        // Group posts by type for display
        const postsByType: Record<string, Post[]> = {};

        dayPosts.forEach((post) => {
          let orgId =
            post.linkedin_posts?.find((lp) => lp.organization_id)
              ?.organization_id || null;
          if (
            !orgId &&
            post.publish_target &&
            post.publish_target !== "personal"
          ) {
            orgId = post.publish_target;
          }

          const isPersonal =
            post.publish_target === "personal" ||
            post.linkedin_posts?.some((lp) => lp.organization_id === null);

          const typeKey = isPersonal ? "personal" : orgId || "default";

          if (!postsByType[typeKey]) {
            postsByType[typeKey] = [];
          }
          postsByType[typeKey].push(post);
        });

        // Create a combined day posts object with all posts
        setSelectedDayPosts({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`,
          posts: dayPosts,
          count: dayPosts.length,
          postType:
            Object.keys(postsByType).length > 1
              ? "mixed"
              : Object.keys(postsByType)[0],
        });
        setSelectedEvent(null); // Clear individual event selection
      } else {
        // No posts for this day, clear selections
        setSelectedDayPosts(null);
        setSelectedEvent(null);
      }
    },
    [getPostsForDay]
  );

  // Custom day cell component to handle day clicks
  const DayCellComponent = (props: any) => {
    const { children, value } = props;
    const date = value as Date;

    // Check if this is today
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    const isSelected =
      selectedDay &&
      date.getFullYear() === selectedDay.getFullYear() &&
      date.getMonth() === selectedDay.getMonth() &&
      date.getDate() === selectedDay.getDate();

    const handleDayClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking directly on an event (events handle their own clicks)
      const target = e.target as HTMLElement;
      if (target.closest(".rbc-event")) {
        return;
      }

      handleDaySelection(date);
    };

    return (
      <div
        className={`rbc-day-bg ${isSelected ? "rbc-selected" : ""} ${
          isToday ? "rbc-today" : ""
        }`}
        onClick={handleDayClick}
        style={{
          cursor: "pointer",
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div className="w-full" style={{ height: `${calendarHeight}px` }}>
              <Calendar
                // Keep the calendar mounted; control the visible month via 'date'
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                date={visibleDate}
                view={Views.MONTH}
                views={[Views.MONTH]}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                selected={selectedRange}
                components={{
                  event: EventComponent,
                  dateCellWrapper: DayCellComponent,
                  toolbar: (props) => (
                    <div className="rbc-toolbar">
                      <div className="flex items-center gap-4">
                        <span className="rbc-toolbar-label">{props.label}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="text-muted-foreground">
                              Personal
                            </span>
                          </div>
                          {Object.entries(organizations).length > 0 &&
                            Object.entries(organizations).map(
                              ([orgId, orgName]) => (
                                <div
                                  key={orgId}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor:
                                        getOrganizationColor(orgId),
                                    }}
                                  ></div>
                                  <span className="text-muted-foreground">
                                    {orgName}
                                  </span>
                                </div>
                              )
                            )}
                        </div>
                      </div>
                      <div className="rbc-btn-group">
                        <button onClick={() => props.onNavigate("PREV")}>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={() => props.onNavigate("TODAY")}>
                          Today
                        </button>
                        <button onClick={() => props.onNavigate("NEXT")}>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ),
                }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.color,
                    border: `1px solid ${event.color}`,
                    borderRadius: "4px",
                    color: "white",
                    fontSize: "12px",
                  },
                })}
                className="rbc-calendar"
              />
            </div>

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Fetching posts...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected day posts */}
      {selectedDayPosts && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Posts for{" "}
                {moment(selectedDayPosts.date).format("MMMM Do, YYYY")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDayPosts(null);
                  setSelectedDay(null);
                  setSelectedRange(null);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(() => {
                const scheduledPosts = selectedDayPosts.posts.filter(
                  (p) => p.status === "SCHEDULED"
                );
                const publishedPosts = selectedDayPosts.posts.filter(
                  (p) => p.status === "PUBLISHED"
                );

                const PostCard = ({ post }: { post: Post }) => (
                  <div
                    className="border rounded-lg p-4 bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onPostClick?.(post)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">Post #{post.id}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {post.content && post.content.trim().length > 0
                        ? truncateContent(post.content, 150)
                        : post.two_para_summary.length > 150
                        ? post.two_para_summary.substring(0, 150) + "..."
                        : post.two_para_summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {post.status === "PUBLISHED"
                          ? `Published at ${moment(post.published_at).format(
                              "h:mm A"
                            )}`
                          : `Scheduled for ${moment(
                              post.scheduled_publish_date
                            ).format("h:mm A")}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: (() => {
                              let orgId =
                                post.linkedin_posts?.find(
                                  (lp) => lp.organization_id
                                )?.organization_id || null;
                              if (
                                !orgId &&
                                post.publish_target &&
                                post.publish_target !== "personal"
                              ) {
                                orgId = post.publish_target;
                              }
                              const isPersonal =
                                post.publish_target === "personal" ||
                                post.linkedin_posts?.some(
                                  (lp) => lp.organization_id === null
                                );
                              return isPersonal
                                ? "hsl(var(--primary))"
                                : orgId
                                ? getOrganizationColor(orgId)
                                : "hsl(142 76% 36%)";
                            })(),
                          }}
                        />
                        <span>
                          {(() => {
                            if (post.publish_target === "personal") {
                              return "Personal";
                            }
                            let organizationId = post.linkedin_posts?.find(
                              (lp) => lp.organization_id
                            )?.organization_id;
                            if (
                              !organizationId &&
                              post.publish_target &&
                              post.publish_target !== "personal"
                            ) {
                              organizationId = post.publish_target;
                            }
                            return organizationId &&
                              organizations[organizationId]
                              ? organizations[organizationId]
                              : "Organization";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <>
                    {scheduledPosts.length > 0 && (
                      <div className="space-y-4">
                        <h3>
                          <LabelWithCount 
                            label="Scheduled" 
                            count={scheduledPosts.length}
                            className="text-sm font-semibold"
                          />
                        </h3>
                        {scheduledPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                    {publishedPosts.length > 0 && (
                      <div className="space-y-4">
                        <h3>
                          <LabelWithCount 
                            label="Published" 
                            count={publishedPosts.length}
                            className="text-sm font-semibold"
                          />
                        </h3>
                        {publishedPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected event details */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Post #{selectedEvent.resource.id}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedDay(null);
                  setSelectedRange(null);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Scheduled for{" "}
              {moment(selectedEvent.start).format("MMMM Do, YYYY [at] h:mm A")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.resource.content &&
                  selectedEvent.resource.content.trim().length > 0
                    ? (() => {
                        const singleLine = selectedEvent.resource.content
                          .replace(/\n/g, " ")
                          .replace(/\s+/g, " ")
                          .trim();
                        return singleLine.length > 200
                          ? singleLine.substring(0, 200) + "..."
                          : singleLine;
                      })()
                    : selectedEvent.resource.two_para_summary.length > 200
                    ? selectedEvent.resource.two_para_summary.substring(
                        0,
                        200
                      ) + "..."
                    : selectedEvent.resource.two_para_summary}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedEvent.color }}
                  />
                  <span>
                    {(() => {
                      if (
                        selectedEvent.resource.publish_target ===
                        "personal"
                      ) {
                        return "Personal";
                      }
                      let organizationId =
                        selectedEvent.resource.linkedin_posts?.find(
                          (lp) => lp.organization_id
                        )?.organization_id;
                      if (
                        !organizationId &&
                        selectedEvent.resource.publish_target &&
                        selectedEvent.resource.publish_target !==
                          "personal"
                      ) {
                        organizationId =
                          selectedEvent.resource.publish_target;
                      }
                      return organizationId && organizations[organizationId]
                        ? organizations[organizationId]
                        : "Organization";
                    })()}
                  </span>
                </div>

                <Badge variant="secondary">
                  {selectedEvent.resource.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No separate "no posts" card; the calendar remains visible even when empty */}

      <style>{`
        /* ===== Base Calendar Container ===== */
.rbc-calendar {
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: visible;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "kern" 1;
  text-rendering: optimizeLegibility;
}

/* ===== Header ===== */
.rbc-header {
  background: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  padding: 0.5rem 0.25rem;
  letter-spacing: 0.05em;
}

/* ===== Month View ===== */
.rbc-month-view {
  border: none;
  background: transparent;
  height: auto !important;
}

.rbc-month-view .rbc-row-bg > .rbc-day-bg:last-child,
.rbc-month-view .rbc-row-content > .rbc-row > .rbc-date-cell:last-child {
  border-right: none;
}

.rbc-time-view,
.rbc-time-content,
.rbc-month-table {
  height: auto !important;
}

/* ===== Date Cells ===== */
.rbc-date-cell {
  padding: 0.25rem;
  text-align: right;
  position: relative;
  overflow: hidden;
  font-weight: 500;
  font-size: 0.875rem;
  user-select: none;
}

/* ===== Day Backgrounds ===== */
.rbc-day-bg {
  border-right: 1px solid hsl(var(--border));
  border-bottom: 1px solid hsl(var(--border));
  background: transparent;
  cursor: pointer !important;
  transition: background-color 0.2s ease;
  position: relative;
}

/* Make sure date cells don't block clicks - they're part of the day cell */
.rbc-date-cell {
  cursor: pointer !important;
  pointer-events: auto;
}

/* Generic rule: ALL calendar cells show pointer cursor */
.rbc-month-view .rbc-day-bg,
.rbc-month-view .rbc-day-bg *,
.rbc-month-view .rbc-date-cell,
.rbc-month-view .rbc-row-content,
.rbc-month-view .rbc-row,
.rbc-month-view .rbc-row-bg {
  cursor: pointer !important;
}

.rbc-day-bg:hover {
  background: hsl(var(--muted) / 0.3);
}

.rbc-day-bg.rbc-off-range-bg {
  background: hsl(var(--muted) / 0.2);
  color: hsl(var(--muted-foreground) / 0.7);
}

.rbc-day-bg.rbc-off-range-bg:hover {
  background: hsl(var(--muted) / 0.35);
}

.rbc-day-bg.rbc-today {
  background: hsl(var(--muted) / 1.5);
}

.rbc-day-bg.rbc-today:hover {
  background: hsl(var(--muted) / 0.55);
}

.rbc-day-bg.rbc-today .rbc-date-cell {
  background: hsl(var(--muted) / 0.3);
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
}

.rbc-day-bg.rbc-selected {
  background: hsl(var(--primary) / 0.1);
}

.rbc-day-bg.rbc-today.rbc-selected {
  background: hsl(var(--primary) / 0.15);
}

.rbc-day-bg.rbc-selected::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid hsl(var(--primary));
  border-radius: 4px;
  pointer-events: none;
  z-index: 1;
  box-sizing: border-box;
}

/* ===== Toolbar ===== */
.rbc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: hsl(var(--card));
  margin-bottom: 0;
}

.rbc-toolbar-label {
  font-weight: 400;
  color: hsl(var(--foreground));
  font-size: 1.25rem;
  letter-spacing: -0.025em;
  text-align: left !important;
}

.rbc-toolbar .rbc-btn-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
}

/* ===== Toolbar Buttons ===== */
.rbc-toolbar button {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.rbc-toolbar button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.rbc-toolbar button:hover::before {
  transform: translateX(100%);
}

.rbc-toolbar button:hover {
  background: hsl(var(--muted));
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.rbc-toolbar button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.rbc-toolbar button.rbc-active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

/* Compact icon-only buttons */
.rbc-toolbar button:has(svg) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  min-width: 2.5rem;
}

.rbc-toolbar button svg {
  width: 1rem;
  height: 1rem;
}

/* ===== Events ===== */
.rbc-events-container {
  padding: 2px;
  gap: 2px;
  pointer-events: none;
}

.rbc-event {
  width: 85%;
  margin: 2px auto;
  border-radius: 6px;
  padding: 2px 4px;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  cursor: pointer !important;
  pointer-events: auto;
}

.rbc-event-overlaps {
  width: 78%;
}

.rbc-event-content {
  display: flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
  cursor: pointer !important;
}

/* ===== Slot Selection ===== */
.rbc-slot-selection {
  background: hsl(var(--primary) / 0.15);
  border: 2px solid hsl(var(--primary));
  border-radius: 4px;
  position: relative;
}

/* ===== Month Rows ===== */
.rbc-month-row {
  overflow: visible;
  position: relative;
  min-height: 120px;
  z-index: 0;
}

.rbc-month-row:last-child {
  border-bottom: none;
}

/* Ensure selected outline appears above adjacent cells */
.rbc-day-bg.rbc-selected {
  z-index: 1;
  position: relative;
}


/* ===== Responsive ===== */
@media (max-width: 768px) {
  .rbc-month-row { min-height: 100px; }
  .rbc-event { font-size: 9px; }
}

@media (max-width: 480px) {
  .rbc-month-row { min-height: 80px; }
  .rbc-event { font-size: 8px; }
}

      `}</style>
    </div>
  );
}
