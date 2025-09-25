// Welcome to your schema
//   Schema driven development is Keystone's modus operandi
//
// This file is where we define the lists, fields and hooks for our data.
// If you want to learn more about how lists are configured, please read
// - https://keystonejs.com/docs/config/lists

import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";

import { Profile } from "./schemas/Profile";
import { ProfileImage } from "./schemas/ProfileImage";
import { Permission } from "./schemas/Permission";
import { Class } from "./schemas/Class";
import { ClassNetwork } from "./schemas/ClassNetwork";
import { Report } from "./schemas/Report";
import { Journal } from "./schemas/Journal";
import { Post } from "./schemas/Post";
import { Talk } from "./schemas/Talk";
import { Word } from "./schemas/Word";
import { Template } from "./schemas/Template";
import { Task } from "./schemas/Task";
import { Study } from "./schemas/Study";
import { StudyImage } from "./schemas/StudyImage";
import { Consent } from "./schemas/Consent";
import { Update } from "./schemas/Update";
import { Dataset } from "./schemas/Dataset";
import { ProposalBoard } from "./schemas/ProposalBoard";
import { ProposalSection } from "./schemas/ProposalSection";
import { ProposalCard } from "./schemas/ProposalCard";
import { Review } from "./schemas/Review";
import { Curriculum } from "./schemas/Curriculum";
import { Lesson } from "./schemas/Lesson";
import { Tag } from "./schemas/Tag";
import { Assignment } from "./schemas/Assignment";
import { Homework } from "./schemas/Homework";
import { SummaryResult } from "./schemas/SummaryResult";
import { Spec } from "./schemas/Spec";
import { Guest } from "./schemas/Guest";
import { VizJournal } from "./schemas/VizJournal";
import { VizPart } from "./schemas/VizPart";
import { VizChapter } from "./schemas/VizChapter";
import { VizSection } from "./schemas/VizSection";
import { Resource } from "./schemas/Resource";
import { Log } from "./schemas/Log";
import { Datasource } from "./schemas/Datasource";

// see https://keystonejs.com/docs/fields/overview for the full list of fields
//   this is a few common fields for an example
import {
  text,
  relationship,
  password,
  timestamp,
  select,
} from "@keystone-6/core/fields";

// the document field is a more complicated field, so it has it's own package
import { document } from "@keystone-6/fields-document";
// if you want to make your own fields, see https://keystonejs.com/docs/guides/custom-fields

// when using Typescript, you can refine your types to a stricter subset by importing
// the generated types from '.keystone/types'
import type { Lists } from ".keystone/types";

export const lists: Lists = {
  Profile,
  ProfileImage,
  Permission,
  Class,
  ClassNetwork,
  Report,
  Journal,
  Post,
  Talk,
  Word,
  Template,
  Task,
  Study,
  StudyImage,
  Consent,
  Update,
  Dataset,
  ProposalBoard,
  ProposalSection,
  ProposalCard,
  Review,
  Curriculum,
  Lesson,
  Tag,
  Assignment,
  Homework,
  SummaryResult,
  Spec,
  Guest,
  VizJournal,
  VizPart,
  VizChapter,
  VizSection,
  Resource,
  Log,
  Datasource,
};
