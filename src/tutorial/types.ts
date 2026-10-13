/** 説明スライド。文字列は i18n の `${stage}.explain.${id}.title/body` */
export type ExplainSlide = {
  id: string;
  /** 図として並べる牌。1 要素が 1 行、行内の空白で組を区切る（mpsz 表記） */
  rows?: string[];
};
