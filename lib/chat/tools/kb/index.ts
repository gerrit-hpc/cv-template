import type { KbTool } from "../types.js";
import { makeGetProfileTool } from "./get-profile.js";
import { makeListExperienceTool } from "./list-experience.js";
import { makeGetExperienceDetailTool } from "./get-experience-detail.js";
import { makeListSkillsTool } from "./list-skills.js";
import { makeGetEducationTool } from "./get-education.js";
import { makeGetValuesTool } from "./get-values.js";

export function buildKbTools(userId: number): KbTool[] {
  return [
    makeGetProfileTool(userId),
    makeListExperienceTool(userId),
    makeGetExperienceDetailTool(userId),
    makeListSkillsTool(userId),
    makeGetEducationTool(userId),
    makeGetValuesTool(userId),
  ];
}
