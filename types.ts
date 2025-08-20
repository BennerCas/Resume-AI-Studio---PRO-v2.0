

export interface Experience {
  id: string;
  title: string;
  company: string;
  date: string;
  description: string;
}

export interface Education {
  id:string;
  degree: string;
  school: string;
  date: string;
}

export interface CoverLetterStyleSettings {
  fontFamily: string;
  fontSize: number;
  textColor: string;
}

export interface StyleSettings {
  layout: string;
  sheetColor: string;
  textColor: string;
  borderColor: string;
  headerBackgroundType: 'color' | 'image';
  headerColor: string;
  headerImageUrl: string;
  profilePictureUrl: string;
  profilePictureShape: 'circle' | 'square' | 'brush';
  profilePicturePosition: 'left' | 'center' | 'right';
  profilePictureSize: number;
  fontFamily: string;
  sectionTitleColor: string;
  skillBackgroundColor: string;
  skillTextColor: string;
}

export interface ContactInfo {
  value: string;
  link: string;
}

export interface PersonalDetails {
  name: string;
  title: string;
  email: ContactInfo;
  email2: ContactInfo;
  phone: ContactInfo;
  phone2: ContactInfo;
  linkedin: ContactInfo;
  definingPhrase: string;
}

export interface QualificationAnalysis {
  qualifiedPercentage: number;
  notQualifiedPercentage: number;
  overqualifiedPercentage: number;
  summary: string;
  qualifiedArgument: string;
  notQualifiedArgument: string;
  overqualifiedArgument: string;
}

export interface AiAnalysis {
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  qualification: QualificationAnalysis;
}

export interface ResumeData {
  personal: PersonalDetails;
  summary: string;
  achievements: string;
  strengths: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  style: StyleSettings;
  jobDescription: string;
  jobDescriptionUrl: string;
  cvInput: string;
  cvInputUrl: string;
  aiAnalysis: AiAnalysis | null;
  coverLetter: string;
  coverLetterStyle: CoverLetterStyleSettings;
  cta: string;
}

export type AiEditAction = 'rephrase' | 'shorten' | 'expand' | 'tone' | 'grammar';
export type AiToneOption = 'Professional' | 'Enthusiastic' | 'Formal' | 'Concise';