import Parser from "rss-parser";
import { chat } from "../handlers/workerHandler.ts";

const parser = new Parser();

const hypixelIncidents: Record<
  string,
  { notified?: boolean; updates?: string[] }
> = {};

export async function checkForIncidents(firstTime = false) {
  try {
    const { items: status } = await parser.parseURL(
      "https://status.hypixel.net/history.rss",
    );

    const latestIncidents = status.filter(
      (data) =>
        new Date(data.pubDate ?? 0).getTime() / 1000 + 43200 >
        Date.now() / 1000,
    );

    for (const incident of latestIncidents) {
      const { title, link } = incident;

      if (!title) {
        continue;
      }

      if (firstTime) {
        hypixelIncidents[title] = { notified: true, updates: [] };
        const updates = JSON.stringify(incident.contentSnippet)
          .split("\\n")
          .filter((_, index) => index % 2 !== 0);

        for (const update of updates) {
          hypixelIncidents[title].updates?.push(update);
        }

        continue;
      }

      if (hypixelIncidents[title]?.notified !== true) {
        hypixelIncidents[title].notified = true;
        chat(`/gc [HYPIXEL STATUS] ${title} | ${link}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const updates = JSON.stringify(incident.contentSnippet)
        .split("\\n")
        .filter((_, index) => index % 2 !== 0);

      for (const update of updates) {
        if (hypixelIncidents[title]?.updates?.includes(update)) continue;

        hypixelIncidents[title].updates ??= [];
        hypixelIncidents[title].updates.push(update);
        chat(`/gc [HYPIXEL STATUS UPDATE] ${title} | ${update}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  } catch (error) {
    console.log(error);
  }
}

const hypixelUpdates: string[] = [];
export async function checkForHypixelUpdates(firstTime = false) {
  try {
    const [{ items: news }, { items: skyblockNews }] = await Promise.all([
      parser.parseURL(
        "https://hypixel.net/forums/news-and-announcements.4/index.rss",
      ),
      parser.parseURL(
        "https://hypixel.net/forums/skyblock-patch-notes.158/index.rss",
      ),
    ]);

    const latestFeed = news.concat(skyblockNews);
    for (const news of latestFeed) {
      const { title, link } = news;

      if (!title || !link || hypixelUpdates.includes(title)) {
        continue;
      }

      if (!firstTime) {
        chat(`/gc [HYPIXEL UPDATE] ${title} | ${link}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      hypixelUpdates.push(title);
    }
  } catch (error) {
    console.log(error);
  }
}
