import * as cheerio from "cheerio";
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
        const response = await fetch(link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
          },
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        const time = Number.parseInt(
          $("time.u-dt").eq(0).attr("data-time") ?? "",
        );
        if (time + 43200 < Math.floor(Date.now() / 1000)) {
          continue;
        }

        chat(`/gc [HYPIXEL UPDATE] ${title} | ${link}`);
        hypixelUpdates.push(title);

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else if (firstTime) {
        hypixelUpdates.push(title);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

let skyblockVersion: string | undefined;
export async function checkForSkyblockVersion() {
  try {
    const response = await fetch(
      "https://api.hypixel.net/v2/resources/skyblock/skills",
    );
    const data = await response.json();

    if (skyblockVersion !== data.version) {
      if (skyblockVersion !== undefined) {
        chat(
          `/gc [HYPIXEL SKYBLOCK] Skyblock version has been updated to ${data.version}! Server restarts might occur!`,
        );
      }

      skyblockVersion = data.version;
    }
  } catch (error) {
    console.log(error);
  }
}
