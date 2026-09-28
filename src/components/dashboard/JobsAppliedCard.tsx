"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function JobsAppliedCard({ count }: { count: number }) {
  return (
    <Card className="sm:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>Jobs Applied</CardTitle>
        <CardTitle className="text-4xl">{count}</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          Create new jobs to apply and track.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
