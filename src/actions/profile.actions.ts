"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddEducationFormSchema } from "@/models/AddEductionForm.schema";
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { AddSummarySectionFormSchema } from "@/models/addSummaryForm.schema";
import { CreateResumeFormSchema } from "@/models/createResumeForm.schema";
import { ResumeSection, SectionType, Summary } from "@/models/profile.model";
import { getCurrentUser } from "@/utils/user.utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

export const getResumeList = async (
  page = 1,
  limit = 15
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.resume.findMany({
        where: {
          profile: {
            userId: user.id,
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          profileId: true,
          FileId: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          _count: {
            select: {
              Job: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.resume.count({
        where: {
          profile: {
            userId: user.id,
          },
        },
      }),
    ]);
    return { data, total, success: true };
  } catch (error) {
    const msg = "Failed to get resume list.";
    return handleError(error, msg);
  }
};

export const getResumeById = async (
  resumeId: string
): Promise<any | undefined> => {
  try {
    if (!resumeId) {
      throw new Error("Please provide resume id");
    }
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const resume = prisma.resume.findUnique({
      where: {
        id: resumeId,
        profile: { userId: user.id },
      },
      include: {
        ContactInfo: true,
        File: true,
        ResumeSections: {
          include: {
            summary: true,
            workExperiences: {
              include: {
                jobTitle: true,
                Company: true,
                location: true,
              },
            },
            educations: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });
    return resume;
  } catch (error) {
    const msg = "Failed to get resume.";
    return handleError(error, msg);
  }
};

export const addContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>
): Promise<any | undefined> => {
  try {
    AddContactInfoFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.resume.update({
      where: {
        id: data.resumeId,
        profile: { userId: user.id },
      },
      data: {
        ContactInfo: {
          connectOrCreate: {
            where: { resumeId: data.resumeId },
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              headline: data.headline,
              email: data.email!,
              phone: data.phone!,
              address: data.address,
            },
          },
        },
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to create contact info.";
    return handleError(error, msg);
  }
};

export const updateContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>
): Promise<any | undefined> => {
  try {
    AddContactInfoFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.contactInfo.update({
      where: {
        id: data.id,
        resume: { profile: { userId: user.id } },
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        headline: data.headline,
        email: data.email!,
        phone: data.phone!,
        address: data.address,
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to update contact info.";
    return handleError(error, msg);
  }
};

export const deleteResumeById = async (
  resumeId: string,
  fileId?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const owned = await prisma.resume.findFirst({ where: { id: resumeId, profile: { userId: user.id } } });
    if (!owned) throw new Error("Resume not found");
    const attachedFile = owned.FileId ? await prisma.file.findUnique({ where: { id: owned.FileId } }) : null;

    await prisma.$transaction(async (prisma) => {
      await prisma.contactInfo.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.summary.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.workExperience.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.education.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.licenseOrCertification.deleteMany({ where: { ResumeSection: { resumeId } } });
      await prisma.otherSection.deleteMany({ where: { ResumeSection: { resumeId } } });
      await prisma.resumeSection.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.resume.delete({
        where: { id: resumeId },
      });
    });
    if (attachedFile) {
      await prisma.file.delete({ where: { id: attachedFile.id } });
      const root = path.resolve(process.env.NODE_ENV === "production" ? "/data/files/resumes" : "data/files/resumes");
      if (path.resolve(attachedFile.filePath).startsWith(root + path.sep)) await fs.promises.unlink(attachedFile.filePath).catch(() => undefined);
    }
    return { success: true };
  } catch (error) {
    const msg = "Failed to delete resume.";
    return handleError(error, msg);
  }
};

export const deleteFile = async (fileId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        Resume: { profile: { userId: user.id } },
      },
    });

    if (!file) throw new Error("File not found");
    const filePath = file.filePath;
    const root = path.resolve(process.env.NODE_ENV === "production" ? "/data/files/resumes" : "data/files/resumes");
    if (!path.resolve(filePath).startsWith(root + path.sep)) throw new Error("Invalid file path");
    await prisma.resume.updateMany({ where: { FileId: fileId, profile: { userId: user.id } }, data: { FileId: null } });

    const fullFilePath = path.join(filePath);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    fs.unlinkSync(filePath);

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    console.log("file deleted successfully!");
  } catch (error) {
    const msg = "Failed to delete file.";
    return handleError(error, msg);
  }
};

export const addResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>
): Promise<any | undefined> => {
  try {
    AddSummarySectionFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    await requireOwnedResume(user.id, data.resumeId);
    const res = await prisma.resumeSection.create({
      data: {
        resumeId: data.resumeId!,
        sectionTitle: data.sectionTitle!,
        sectionType: SectionType.SUMMARY,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: res.id,
      },
      data: {
        summary: {
          create: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to create summary.";
    return handleError(error, msg);
  }
};

export const updateResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>
): Promise<any | undefined> => {
  try {
    AddSummarySectionFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const res = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: user.id } },
      },
      data: {
        sectionTitle: data.sectionTitle!,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: user.id } },
      },
      data: {
        summary: {
          update: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update summary.";
    return handleError(error, msg);
  }
};

export const addExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>
): Promise<any | undefined> => {
  try {
    AddExperienceFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    if (!await prisma.location.findFirst({ where: { id: data.location, createdBy: user.id } })) throw new Error("Location not found");
    if (!await prisma.company.findFirst({ where: { id: data.company, createdBy: user.id } }) || !await prisma.jobTitle.findFirst({ where: { id: data.title, createdBy: user.id } })) throw new Error("Experience reference not found");


    if (!data.sectionId && !data.sectionTitle) {
      throw new Error("SectionTitle is required.");
    }

    await requireOwnedResume(user.id, data.resumeId);
    if (data.sectionId && !await prisma.resumeSection.findFirst({ where: { id: data.sectionId, resumeId: data.resumeId, Resume: { profile: { userId: user.id } } } })) throw new Error("Section not found");
    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EXPERIENCE,
          },
        })
      : undefined;

    const experience = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        workExperiences: {
          create: {
            jobTitleId: data.title,
            companyId: data.company,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.jobDescription,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: experience, success: true };
  } catch (error) {
    const msg = "Failed to create experience.";
    return handleError(error, msg);
  }
};

export const updateExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>
): Promise<any | undefined> => {
  try {
    AddExperienceFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    if (!await prisma.location.findFirst({ where: { id: data.location, createdBy: user.id } })) throw new Error("Location not found");
    if (!await prisma.company.findFirst({ where: { id: data.company, createdBy: user.id } }) || !await prisma.jobTitle.findFirst({ where: { id: data.title, createdBy: user.id } })) throw new Error("Experience reference not found");

    // const res = await prisma.resumeSection.update({
    //   where: {
    //     id: data.id,
    //   },
    //   data: {
    //     sectionTitle: data.sectionTitle!,
    //   },
    // });

    const summary = await prisma.workExperience.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: user.id } } },
      },
      data: {
        jobTitleId: data.title,
        companyId: data.company,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.jobDescription,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update experience.";
    return handleError(error, msg);
  }
};

export const addEducation = async (
  data: z.infer<typeof AddEducationFormSchema>
): Promise<any | undefined> => {
  try {
    AddEducationFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    if (!await prisma.location.findFirst({ where: { id: data.location, createdBy: user.id } })) throw new Error("Location not found");

    await requireOwnedResume(user.id, data.resumeId);
    if (data.sectionId && !await prisma.resumeSection.findFirst({ where: { id: data.sectionId, resumeId: data.resumeId, Resume: { profile: { userId: user.id } } } })) throw new Error("Section not found");
    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EDUCATION,
          },
        })
      : undefined;

    const education = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        educations: {
          create: {
            institution: data.institution,
            degree: data.degree,
            fieldOfStudy: data.fieldOfStudy,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: education, success: true };
  } catch (error) {
    const msg = "Failed to create education.";
    return handleError(error, msg);
  }
};

export const updateEducation = async (
  data: z.infer<typeof AddEducationFormSchema>
): Promise<any | undefined> => {
  try {
    AddEducationFormSchema.parse(data);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    if (!await prisma.location.findFirst({ where: { id: data.location, createdBy: user.id } })) throw new Error("Location not found");

    // const res = await prisma.resumeSection.update({
    //   where: {
    //     id: data.id,
    //   },
    //   data: {
    //     sectionTitle: data.sectionTitle!,
    //   },
    // });

    const summary = await prisma.education.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: user.id } } },
      },
      data: {
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update education.";
    return handleError(error, msg);
  }
};

async function requireOwnedResume(userId: string, id?: string) {
  if (!id || !await prisma.resume.findFirst({ where: { id, profile: { userId } } })) throw new Error("Resume not found");
}
