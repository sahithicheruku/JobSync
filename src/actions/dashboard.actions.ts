import prisma from "@/lib/db";
import { calculatePercentageDifference, getLast7Days } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";
import { Prisma } from "@prisma/client";
import { addMinutes, format, subDays } from "date-fns";

export const getJobsAppliedForPeriod = async (
  daysAgo: number
): Promise<any | undefined> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    const startDate1 = subDays(new Date(), daysAgo);
    const startDate2 = subDays(new Date(), daysAgo * 2);
    const endDate = new Date();
    const query = (gte: Date, lt: Date): Prisma.JobCountArgs => ({
      where: {
        userId: user.id,
        Status: { value: { in: ["applied", "interview", "offer"] } },
        appliedDate: {
          gte,
          lt,
        },
      },
    });

    const [count, count2] = await prisma.$transaction([
      prisma.job.count(query(startDate1, endDate)),
      prisma.job.count(query(startDate2, startDate1)),
    ]);
    const trend = calculatePercentageDifference(count2, count);
    return { count, trend };
  } catch (error) {
    const msg = "Failed to calculate job count";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getJobsAppliedTotal = async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return prisma.job.count({
    where: {
      userId: user.id,
      Status: { value: { in: ["applied", "interview", "offer"] } },
      appliedDate: { not: null },
    },
  });
};

export const getJobFunnelData = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const statuses = ["draft", "applied", "interview", "offer"] as const;
  const counts = await prisma.$transaction(
    statuses.map((value) =>
      prisma.job.count({ where: { userId: user.id, Status: { value } } })
    )
  );

  return statuses.map((status, index) => ({
    status,
    count: counts[index],
    conversionRate: index === 0 ? 100 : counts[index - 1]
      ? Math.round((counts[index] / counts[index - 1]) * 100)
      : 0,
  }));
};

export const getRecentJobs = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const list = await prisma.job.findMany({
      where: {
        userId: user.id,
        Status: { value: { in: ["applied", "interview", "offer"] } },
        appliedDate: { not: null },
      },
      include: {
        JobSource: true,
        JobTitle: true,
        Company: true,
        Status: true,
        Location: true,
      },
      orderBy: {
        appliedDate: "desc",
      },
      take: 6,
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getActivityDataForPeriod = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const today = addMinutes(new Date(), 5);
    const sevenDaysAgo = subDays(today, 6);
    const activities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        endTime: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        endTime: true,
        duration: true,
        activityType: {
          select: {
            label: true,
          },
        },
      },
      orderBy: {
        endTime: "asc",
      },
    });
    const groupedData = activities.reduce((acc: any, activity: any) => {
      if (!activity.endTime) return acc;
      const day = format(new Date(activity.endTime), "yyyy-MM-dd");
      const activityTypeLabel = activity.activityType?.label || "Unknown";

      if (!acc[day]) {
        acc[day] = { day: day.split(",")[0] };
      }

      const durationInHours = (activity.duration || 0) / 60;
      acc[day][activityTypeLabel] = (
        (parseFloat(acc[day][activityTypeLabel]) || 0) + durationInHours
      ).toFixed(1);

      return acc;
    }, {});
    const last7Days = getLast7Days("yyyy-MM-dd");
    const result = last7Days.map((date) => ({
      day: format(new Date(date), "EEE"),
      ...groupedData[date],
    }));

    return result;
  } catch (error) {
    const msg = "Failed to fetch activities data.";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getJobsActivityForPeriod = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    const jobs = await prisma.job.findMany({
      where: {
        userId: user.id,
        Status: { value: { in: ["applied", "interview", "offer"] } },
        appliedDate: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: { appliedDate: true },
    });
    const groupedPosts = jobs.reduce((acc: Record<string, number>, job) => {
      const date = format(new Date(job.appliedDate!), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    // Get the last 7 days
    const last7Days = getLast7Days("yyyy-MM-dd");
    // Map to ensure all dates are represented with a count of 0 if necessary
    const result = last7Days.map((date) => ({
      day: format(new Date(date), "EEE"),
      value: groupedPosts[date] || 0,
    }));

    return result;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};

export const getActivityCalendarData = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - 356);
    const jobs = await prisma.job.findMany({
      where: {
        userId: user.id,
        Status: { value: { in: ["applied", "interview", "offer"] } },
        appliedDate: {
          gte: daysAgo, // A year of data
          lte: today,
        },
      },
      select: { appliedDate: true },
    });

    type InputObject = {
      [key: string]: number;
    };

    type OutputObject = {
      day: string;
      value: number;
    };

    // Reduce to a format that groups by unique date (YYYY-MM-DD)
    const groupedJobs = jobs.reduce((acc: Record<string, number>, job) => {
      const date = format(new Date(job.appliedDate!), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const groupedByYear = Object.entries(groupedJobs).reduce(
      (acc: any, [date, value]) => {
        const year = date.split("-")[0];
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push({ day: date, value });
        return acc;
      },
      {}
    );

    return groupedByYear;
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    console.error(msg, error);
    throw new Error(msg);
  }
};
