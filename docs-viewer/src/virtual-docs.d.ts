declare module 'virtual:docs' {
  export interface FileEntry {
    id: string;
    label: string;
  }
  export interface SectionEntry {
    label: string;
    files: FileEntry[];
  }
  export const docTree: Record<string, SectionEntry>;
  export const docContent: Record<string, string>;
}
