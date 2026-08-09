import type { Article, ArticleCategory } from "@/types";
import { assertUniqueContentRecords } from "@/lib";

export const articleCategories: readonly ArticleCategory[] = Object.freeze([]);
export const articles: readonly Article[] = Object.freeze([]);

assertUniqueContentRecords(articleCategories, "article categories");
assertUniqueContentRecords(articles, "articles");

