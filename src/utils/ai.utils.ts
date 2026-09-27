import { JobResponse } from "@/models/job.model";
import {
  ContactInfo,
  Education,
  Resume,
  ResumeSection,
  SectionType,
  WorkExperience,
} from "@/models/profile.model";

const removeHtmlTags = (description: string | undefined): string => {
  if (!description) return "N/A";
  return description.replace(/<\/(p|li|div)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
};

export const convertResumeToText = (resume: Resume): Promise<string> => {
  return new Promise((resolve) => {
    const formatContactInfo = (contactInfo?: ContactInfo) => {
      if (!contactInfo) return "";
      return `
       Name: ${contactInfo.firstName} ${contactInfo.lastName}
       Headline: ${contactInfo.headline}
       Email: ${contactInfo.email || "N/A"}
       Phone: ${contactInfo.phone || "N/A"}
       Address: ${contactInfo.address || "N/A"}
       `;
    };

    const formatWorkExperiences = (workExperiences?: WorkExperience[]) => {
      if (!workExperiences || workExperiences.length === 0) return "";
      return workExperiences
        .map(
          (experience) => `
         Company: ${experience.Company.label}
         Dates: ${new Date(experience.startDate).toISOString().slice(0,10)} to ${experience.endDate ? new Date(experience.endDate).toISOString().slice(0,10) : "Present"}
         Job Title: ${experience.jobTitle.label}
         Location: ${experience.location.label}
         Description: ${removeHtmlTags(experience.description)}
         `
        )
        .join("\n");
    };
    // Start Date: ${experience.startDate.toLocaleDateString().split("T")[0]}
    // End Date: ${
    //   experience.currentJob
    //     ? "Present"
    //     : experience.endDate.toLocaleDateString().split("T")[0]
    // }

    const formatEducation = (educations?: Education[]) => {
      if (!educations || educations.length === 0) return "";
      return (
        educations
          .map(
            (education) => `
             Institution: ${education.institution}
             Dates: ${new Date(education.startDate).toISOString().slice(0,10)} to ${education.endDate ? new Date(education.endDate).toISOString().slice(0,10) : "Present"}
             Degree: ${education.degree}
             Field of Study: ${education.fieldOfStudy}
             Location: ${education.location.label}
             Description: ${removeHtmlTags(education.description)}
             `
          )
          // Start Date: ${education.startDate.toLocaleDateString().split("T")[0]}
          // End Date: ${
          //   education.endDate
          //     ? education.endDate.toLocaleDateString().split("T")[0]
          //     : "N/A"
          // }
          .join("\n")
      );
    };

    const formatResumeSections = (sections?: ResumeSection[]) => {
      if (!sections || sections.length === 0) return "";
      return sections
        .map((section) => {
          switch (section.sectionType) {
            case SectionType.SUMMARY:
              return `Summary: ${removeHtmlTags(section.summary?.content)}`;
            case SectionType.EXPERIENCE:
              return formatWorkExperiences(section.workExperiences);
            case SectionType.EDUCATION:
              return formatEducation(section.educations);
            default:
              return `${section.sectionTitle}: ${(section.others || []).map(item => `${item.title}: ${removeHtmlTags(item.content)}`).join("\n")} ${(section.licenseOrCertifications || []).map(item => `${item.title}, ${item.organization}`).join("\n")}`;
          }
        })
        .join("\n");
    };

    const inputMessage = `
                 
                 Title: ${resume.title}
                 ${formatContactInfo(resume.ContactInfo)}
                 ${formatResumeSections(resume.ResumeSections)}
                 `;
    return resolve(inputMessage);
  });
};

export const convertJobToText = (job: JobResponse): Promise<string> => {
  return new Promise((resolve) => {
    const {
      description,
      JobTitle: { label: jobTitle },
      Company: { label: companyName },
      Location,
    } = job;

    const jobText = `
       Job Title: ${jobTitle}
       Company: ${companyName}
       Location: ${Location?.label || "Not specified"}
       Description: ${removeHtmlTags(description)}
     `;

    return resolve(jobText);
  });
};
