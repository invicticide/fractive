/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface FractiveProject {
  /**
   * The game title that will be shown to players
   */
  title?: string;
  /**
   * The author name that will be shown to players
   */
  author?: string;
  /**
   * The long-form game description that will be shown to players
   */
  description?: string;
  /**
   * A web URL that will be shown to players
   */
  website?: string;
  /**
   * List of glob-style patterns for locating Markdown source files. These are compiled in the order in which they appear.
   */
  markdown?: string[];
  /**
   * List of glob-style patterns for locating Javascript files reside. These are imported in the order in which they appear.
   */
  javascript?: string[];
  /**
   * List of glob-style patterns for locating additional asset files. These are imported in the order in which they appear.
   */
  assets?: string[];
  /**
   * List of glob-style patterns for files to ignore. Ignores are applied when searching for Markdown files, Javascript files, and asset files.
   */
  ignore?: string[];
  aliases?: {
    alias?: string;
    replaceWith?: string;
    end?: string;
    [k: string]: any;
  }[];
  /**
   * The HTML template file to use for the final story output
   */
  template?: string;
  /**
   * The folder where the final story files will be saved
   */
  output?: string;
  /**
   * Options: 'minify' to minify the final story HTML (reduces file size but makes the HTML source much less human-readable), 'prettify' to prettify the final story HTML into human-readable HTML, 'default' for no additional processing
   */
  outputFormat?: "prettify" | "minify" | "default";
  /**
   * If true, show a tooltip on macro links indicating the macro destination. (Useful for dev, but you probably want to disable it for release.)
   */
  linkTooltips?: boolean;
  /**
   * Raw HTML to be inserted at the end of different Fractive link types.
   */
  linkTags?: {
    /**
     * Tag for external links.
     */
    external?: string;
    /**
     * Tag for links that expand inline.
     */
    inline?: string;
    /**
     * Tag for links between sections.
     */
    section?: string;
    /**
     * Tag for links that execute funcitons.
     */
    function?: string;
    [k: string]: any;
  };
  /**
   * Raw HTML inserted in the place where the back button is defined to be.
   */
  backButtonHTML?: string;
}
