import { getJobDetails, getStatusList } from "@/actions/job.actions";
import JobDetails from "@/components/myjobs/JobDetails";

async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ job }, statuses] = await Promise.all([getJobDetails(id), getStatusList()]);

  return (
    <div className="col-span-3">
      <JobDetails job={job} statuses={statuses} />
    </div>
  );
}

export default JobDetailsPage;
